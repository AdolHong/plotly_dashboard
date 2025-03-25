export interface ReportResponse {
    dataSources: {
        name: string;
        description?: string;
        executor:{
            type: 'sql' | 'python';
            engine: string;
        },
        code: string;
        dfName?: string;
        updateMode?: {
            type: 'auto' | 'manual';
            interval?: number;
        }
    }[];
    parameters: {
        name: string;
        description?: string;
        type: 'single_select' | 'multi_select' | 'single_input' | 'multi_input' | 'date_picker';
        default?: string | number | boolean | string;
        choices?: string[];
        format?: {
            sep?: string;
            wrapper?: string;
            dateFormat?: string;
            timeFormat?: string;
            datetimeFormat?: string;
        }
    }[];
    visualizations: {
        code: string;
        title: string;
        description?: string;
        executor: {
            type: 'python';
            engine: string;
        },
        vizParams?: {
            name: string;
            description?: string;
            type: 'str' | 'int' | 'float' | 'bool' | 'date' | 'datetime';
            selectionMode: 'single' | 'multiple';
            default?: string | number | boolean | string[] | number[];
            choices?: string[] | number[];
            cascade?:{
                column: string;
                level: number;
            };
            format?: {
                sep?: string;
                wrapper?: string;
                dateFormat?: string;
                timeFormat?: string;
                datetimeFormat?: string;
            }
        }[];
    }[];
}