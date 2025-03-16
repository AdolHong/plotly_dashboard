import React, { useMemo, useState } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getFilteredRowModel, 
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  // 排序状态
  SortingState,
  // 列定义类型
  ColumnDef
} from '@tanstack/react-table';
import { Input, Typography } from 'antd';

const { Title, Text } = Typography;
const { Search } = Input;

const DataTable = ({ data }) => {
  // 全局过滤状态
  const [globalFilter, setGlobalFilter] = useState('');
  
  // 排序状态
  const [sorting, setSorting] = useState([]);

  // 从数据中动态生成列
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return Object.keys(data[0]).map(key => ({
      accessorKey: key,
      header: key,
      // 启用排序
      enableSorting: true,
      cell: info => {
        const value = info.getValue();
        if (value === null || value === undefined) return '-';
        if (typeof value === 'boolean') return value ? '是' : '否';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      }
    }));
  }, [data]);

  // 创建表格实例
  const table = useReactTable({
    data: data || [], 
    columns,
    state: {
      // 连接全局过滤和排序状态
      globalFilter,
      sorting
    },
    // 启用排序和过滤
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10, 
      },
    },
  });

  // 如果没有数据，渲染空状态
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '5px', marginTop: '20px' }}>
        <Title level={4}>查询结果</Title>
        <p>暂无数据，请执行查询</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '5px', marginTop: '20px' }}>
      <Title level={4}>查询结果 ({data.length} 条记录)</Title>
      
      {/* 全局搜索 */}
      <div style={{ marginBottom: '16px' }}>
        <Text>全局搜索：</Text>
        <Search
          placeholder="在所有列中搜索"
          allowClear
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          style={{ width: 300, marginLeft: '10px' }}
        />
      </div>
      
      {/* 表格 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id} 
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ 
                      border: '1px solid #ddd', 
                      padding: '8px', 
                      backgroundColor: '#f2f2f2',
                      cursor: header.column.getCanSort() ? 'pointer' : 'default'
                    }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {/* 排序指示器 */}
                    {{
                      asc: ' 🔼',
                      desc: ' 🔽'
                    }[header.column.getIsSorted()] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr 
                key={row.id} 
                style={{ 
                  backgroundColor: row.index % 2 === 0 ? 'white' : '#f9f9f9' 
                }}
              >
                {row.getVisibleCells().map(cell => (
                  <td 
                    key={cell.id} 
                    style={{ 
                      border: '1px solid #ddd', 
                      padding: '8px' 
                    }}
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页控件 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: '10px' 
      }}>
        <div>
          <button 
            onClick={() => table.previousPage()} 
            disabled={!table.getCanPreviousPage()}
          >
            上一页
          </button>
          <button 
            onClick={() => table.nextPage()} 
            disabled={!table.getCanNextPage()}
          >
            下一页
          </button>
          <span>
            第 {table.getState().pagination.pageIndex + 1} 页，共 {table.getPageCount()} 页
          </span>
        </div>
        <div>
          每页显示：
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => {
              table.setPageSize(Number(e.target.value))
            }}
          >
            {[5, 10, 20, 50].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default DataTable; 