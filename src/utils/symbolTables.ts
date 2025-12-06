import type {
  ParseAddSymData,
  ParseAssgnSymType,
  ParseCreateScopeData,
  ParseEnterExitScopeData,
  Step,
} from "../types/steps";

export interface SymbolEntry {
  name: string;
  type: string;
  line_no: string;
  char_no: string;
  is_function: string;
  is_duplicate: string;
}

export interface SymbolTableRecord {
  id: number;
  name: string;
  parentId: number | null;
  symbols: SymbolEntry[];
  children: number[];
}

export interface SymbolTableState {
  tables: SymbolTableRecord[];
  focusId: number | null;
}

const toNumber = (value: string | number | undefined | null) => {
  if (value === undefined || value === null) return NaN;
  const num = Number(value);
  return Number.isNaN(num) ? NaN : num;
};

export const deriveSymbolTableState = (
  steps: Step[],
  uptoIndex: number
): SymbolTableState => {
  const tables = new Map<number, SymbolTableRecord>();
  const parentMap = new Map<number, number | null>();
  parentMap.set(0, null);
  let focusId: number | null = null;

  const ensureTable = (id: number, name?: string) => {
    const existing = tables.get(id);
    const derivedName = name || (id === 0 ? "global" : `scope_${id}`);
    const parent = parentMap.has(id) ? parentMap.get(id)! : null;

    if (existing) {
      if (!existing.name && derivedName) existing.name = derivedName;
      if (existing.parentId === null) existing.parentId = parent ?? null;
      return existing;
    }

    const fresh: SymbolTableRecord = {
      id,
      name: derivedName,
      parentId: parent ?? null,
      symbols: [],
      children: [],
    };
    tables.set(id, fresh);
    return fresh;
  };

  const upperBound = Math.min(uptoIndex, steps.length - 1);
  if (upperBound < 0) {
    return { tables: [], focusId: null };
  }

  steps.slice(0, upperBound + 1).forEach((step) => {
    switch (step.type) {
      case "PARSE_CREATE_SCOPE": {
        const data = step.data as ParseCreateScopeData;
        const tableId = toNumber(data.table_id);
        if (Number.isNaN(tableId)) break;
        const parentIdRaw = toNumber(data.parent_id);
        const parentId =
          Number.isNaN(parentIdRaw) || parentIdRaw === tableId ? null : parentIdRaw;
        parentMap.set(tableId, parentId);
        ensureTable(tableId, data.name);
        if (parentId !== null) ensureTable(parentId);
        focusId = tableId;
        break;
      }
      case "PARSE_ENTER_SCOPE": {
        const data = step.data as ParseEnterExitScopeData;
        const tableId = toNumber(data.table_id);
        if (Number.isNaN(tableId)) break;
        ensureTable(tableId, data.name);
        focusId = tableId;
        break;
      }
      case "PARSE_EXIT_SCOPE": {
        const data = step.data as ParseEnterExitScopeData;
        const tableId = toNumber(data.table_id);
        if (Number.isNaN(tableId)) break;
        const table = ensureTable(tableId, data.name);
        const parentId = table.parentId ?? parentMap.get(tableId) ?? null;
        focusId = parentId ?? focusId;
        break;
      }
      case "PARSE_ADD_SYM": {
        const data = step.data as ParseAddSymData;
        const scopeId = toNumber(data.scope_id);
        if (Number.isNaN(scopeId)) break;
        const table = ensureTable(scopeId);
        table.symbols.push({
          name: data.name,
          type: data.sym_type,
          line_no: data.line_no,
          char_no: data.char_no,
          is_function: data.is_function,
          is_duplicate: data.is_duplicate,
        });
        focusId = scopeId;
        break;
      }
      case "PARSE_ASSGN_SYM_TYPE": {
        const data = step.data as ParseAssgnSymType;
        const scopeId = toNumber(data.scope_id);
        if (Number.isNaN(scopeId)) break;
      
        const table = ensureTable(scopeId);
        const sym = table.symbols.find((s) => s.name === data.name);
      
        if (sym) {
          sym.type = data.sym_type;
        }
      
        focusId = scopeId;
        break;
      }
      default:
        break;
    }
  });

  tables.forEach((table) => {
    table.children = [];
  });
  tables.forEach((table) => {
    if (table.parentId !== null) {
      const parent = tables.get(table.parentId);
      if (parent && !parent.children.includes(table.id)) {
        parent.children.push(table.id);
      }
    }
  });

  return {
    tables: Array.from(tables.values()).sort((a, b) => a.id - b.id),
    focusId,
  };
};

