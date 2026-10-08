import { useCallback, useEffect, useRef, useState } from 'react';

// Lightweight rich-text editor (contentEditable + execCommand, no dependency) that emits HTML.
// Port of pick_frontend src/components/ui/RichTextEditor.tsx — keep the toolbar in sync.

const CONTENT_CLS =
  '[&_h1]:text-xl [&_h1]:font-bold [&_h1]:my-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:my-2 ' +
  '[&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 ' +
  '[&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-3 [&_blockquote]:text-gray-500 [&_blockquote]:my-2 ' +
  '[&_pre]:bg-gray-100 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:my-2 [&_pre]:whitespace-pre-wrap ' +
  '[&_a]:text-brand-600 [&_a]:underline ' +
  '[&_table]:w-full [&_table]:border-collapse [&_table]:my-2 ' +
  '[&_td]:border [&_td]:border-gray-300 [&_td]:p-2 [&_td]:min-w-16 [&_td]:align-top ' +
  '[&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_th]:bg-gray-50';

const isEmptyHtml = (el) => !el.textContent?.trim() && !el.querySelector('table, li, hr');

function ToolButton({ label, title, onClick, active = false, disabled = false }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      // Keep the editor's selection when clicking a toolbar button.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`h-7 min-w-7 rounded-md px-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
        active ? 'bg-brand-500 text-white' : 'text-gray-700 hover:bg-white'
      }`}
    >
      {label}
    </button>
  );
}

const Divider = () => <span className="mx-0.5 h-5 w-px bg-gray-300" />;

export default function RichTextEditor({ id, value, onChange, placeholder, minHeight = 140 }) {
  const editorRef = useRef(null);
  const [inTable, setInTable] = useState(false);
  const [state, setState] = useState({});

  // Push external value changes into the DOM without touching it while the admin types.
  useEffect(() => {
    const el = editorRef.current;
    if (el && el.innerHTML !== (value ?? '')) el.innerHTML = value ?? '';
  }, [value]);

  const emit = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    onChange(isEmptyHtml(el) ? '' : el.innerHTML);
  }, [onChange]);

  const currentCell = useCallback(() => {
    const node = window.getSelection()?.anchorNode;
    if (!node) return null;
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    const cell = element?.closest('td, th');
    return cell && editorRef.current?.contains(cell) ? cell : null;
  }, []);

  useEffect(() => {
    const onSelection = () => {
      const el = editorRef.current;
      const node = window.getSelection()?.anchorNode;
      if (!el || !node || !el.contains(node)) return;
      const block = String(document.queryCommandValue('formatBlock') || '').toLowerCase();
      setState({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
        h1: block === 'h1',
        h2: block === 'h2',
        blockquote: block === 'blockquote',
        pre: block === 'pre',
      });
      setInTable(!!currentCell());
    };
    document.addEventListener('selectionchange', onSelection);
    return () => document.removeEventListener('selectionchange', onSelection);
  }, [currentCell]);

  const exec = (command, arg) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  };

  const toggleBlock = (tag) => {
    const current = String(document.queryCommandValue('formatBlock') || '').toLowerCase();
    exec('formatBlock', current === tag ? '<p>' : `<${tag}>`);
  };

  const addLink = () => {
    const sel = window.getSelection();
    const range = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    const url = window.prompt('Link URL', 'https://')?.trim();
    if (!url || !/^(https?:\/\/|mailto:)/i.test(url)) return;
    editorRef.current?.focus();
    if (range) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
    if (range && !range.collapsed) {
      exec('createLink', url);
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.textContent = url;
      exec('insertHTML', a.outerHTML);
    }
  };

  const insertTable = () => {
    const row = '<tr><td><br></td><td><br></td></tr>';
    exec('insertHTML', `<table><tbody>${row}${row}</tbody></table><p><br></p>`);
  };

  // Table structure edits act on the cell holding the caret.
  const editTable = (action) => {
    const cell = currentCell();
    const table = cell?.closest('table');
    const row = cell?.parentElement;
    if (!cell || !table || !row) return;
    const index = cell.cellIndex;
    const newCell = (tag = 'td') => {
      const c = document.createElement(tag);
      c.innerHTML = '<br>';
      return c;
    };

    if (action === 'colBefore' || action === 'colAfter') {
      Array.from(table.rows).forEach((r) => {
        const ref = r.cells[index];
        const c = newCell(ref?.tagName.toLowerCase());
        if (!ref) r.appendChild(c);
        else if (action === 'colAfter') ref.after(c);
        else ref.before(c);
      });
    } else if (action === 'colRemove') {
      Array.from(table.rows).forEach((r) => r.cells[index]?.remove());
      if (!table.rows[0]?.cells.length) table.remove();
    } else if (action === 'rowBefore' || action === 'rowAfter') {
      const r = document.createElement('tr');
      Array.from(row.cells).forEach((c) => r.appendChild(newCell(c.tagName.toLowerCase())));
      if (action === 'rowAfter') row.after(r);
      else row.before(r);
    } else if (action === 'rowRemove') {
      row.remove();
      if (!table.rows.length) table.remove();
    } else {
      table.remove();
    }
    setInTable(!!currentCell());
    emit();
  };

  return (
    <div className="rounded-lg border border-gray-300 bg-white focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 rounded-t-lg border-b border-gray-200 bg-gray-50 p-1">
        <ToolButton label={<b>B</b>} title="Bold" onClick={() => exec('bold')} active={state.bold} />
        <ToolButton label={<i>I</i>} title="Italic" onClick={() => exec('italic')} active={state.italic} />
        <ToolButton label={<u>U</u>} title="Underline" onClick={() => exec('underline')} active={state.underline} />
        <ToolButton label={<s>S</s>} title="Strikethrough" onClick={() => exec('strikeThrough')} active={state.strikeThrough} />
        <Divider />
        <ToolButton label="H1" title="Heading 1" onClick={() => toggleBlock('h1')} active={state.h1} />
        <ToolButton label="H2" title="Heading 2" onClick={() => toggleBlock('h2')} active={state.h2} />
        <Divider />
        <ToolButton label="• List" title="Bulleted list" onClick={() => exec('insertUnorderedList')} active={state.insertUnorderedList} />
        <ToolButton label="1. List" title="Numbered list" onClick={() => exec('insertOrderedList')} active={state.insertOrderedList} />
        <ToolButton label="❝" title="Quote" onClick={() => toggleBlock('blockquote')} active={state.blockquote} />
        <ToolButton label="</>" title="Code block" onClick={() => toggleBlock('pre')} active={state.pre} />
        <ToolButton label="🔗" title="Link" onClick={addLink} />
        <Divider />
        <ToolButton label="田 Table" title="Insert table" onClick={insertTable} />
        <ToolButton label="+Col←" title="Add column left" onClick={() => editTable('colBefore')} disabled={!inTable} />
        <ToolButton label="+Col→" title="Add column right" onClick={() => editTable('colAfter')} disabled={!inTable} />
        <ToolButton label="−Col" title="Delete column" onClick={() => editTable('colRemove')} disabled={!inTable} />
        <ToolButton label="+Row↑" title="Add row above" onClick={() => editTable('rowBefore')} disabled={!inTable} />
        <ToolButton label="+Row↓" title="Add row below" onClick={() => editTable('rowAfter')} disabled={!inTable} />
        <ToolButton label="−Row" title="Delete row" onClick={() => editTable('rowRemove')} disabled={!inTable} />
        <ToolButton label="✕ Table" title="Delete table" onClick={() => editTable('remove')} disabled={!inTable} />
      </div>
      <div className="relative">
        {!value && placeholder && (
          <span className="pointer-events-none absolute left-3 top-2 text-sm text-gray-400">{placeholder}</span>
        )}
        <div
          id={id}
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          contentEditable
          onInput={emit}
          onBlur={emit}
          onPaste={(e) => {
            // Paste as plain text so foreign markup and styles don't come along.
            e.preventDefault();
            document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
          }}
          style={{ minHeight }}
          className={`max-h-[480px] overflow-y-auto px-3 py-2 text-sm text-gray-900 outline-none ${CONTENT_CLS}`}
        />
      </div>
    </div>
  );
}
