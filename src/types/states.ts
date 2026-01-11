export interface ParserItem {
  rule: number;
  item: string; // e.g. "expr: ID •"
}

export interface ParserShift {
  symbol: string;
  to: number;
}

export interface ParserReduce {
  symbol?: string; // optional (only for explicit reduces)
  rule: number;
  lhs?: string;
}

export interface ParserGoto {
  symbol: string;
  to: number;
}

export interface ParserDefaultAction {
  action: "reduce" | "accept";
  rule?: number;
  lhs?: string;
}

export interface ParserState {
  state: number;
  items: ParserItem[];
  shifts: ParserShift[];
  reduces: ParserReduce[];
  gotos: ParserGoto[];
  default: ParserDefaultAction | null;
}
