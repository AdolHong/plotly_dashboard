// 数据源接口
export interface Source {
  name: string;
  description?: string;
  executor: {
    type: "sql" | "python";
    engine: string;
  };
  code: string;
  dfName?: string;
  updateMode?: {
    type: "auto" | "manual";
    interval?: number;
  };
}

// 参数接口
export interface Parameter {
  name: string;
  description?: string;
  type:
    | "single_select"
    | "multi_select"
    | "single_input"
    | "multi_input"
    | "date_picker";
  default?: string;
  choices?: string[];
  format?: {
    dateFormat?: string;
    timeFormat?: string;
    datetimeFormat?: string;
    sep?: string;
    wrapper?: string;
  };
}

// 可视化参数接口
export interface VizParam {
  name: string;
  description?: string;
  type: "str" | "int" | "float" | "bool";
  selectionMode: "single" | "multiple";
  default?: string | number | boolean | string[] | number[];
  choices?: string[] | number[];
  // 级联配置
  cascade?: {
    column: string;
    level: number;
  };
}

// 可视化接口
export interface Visualization {
  title: string;
  description?: string;
  code: string;
  dependencies: string[]; // 依赖哪个数据源
  executor: {
    type: "python";
    engine: string;
  };
  vizParams?: VizParam[];
}

// 主要响应接口
export interface ReportResponse {
  sources: Source[];
  parameters: Parameter[]; // 使用之前定义的 Parameter 接口
  visualizations: Visualization[];
}
