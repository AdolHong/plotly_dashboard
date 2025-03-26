import duckdb
import os
from pathlib import Path

# 数据库文件路径
DB_PATH = Path(__file__).parent.parent.parent / "data" / "dashboard.duckdb"

# 确保数据目录存在
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

def get_connection():
    import socket
    if socket.gethostname() == "Jiahaos-MacBook-Pro.local":
        # 开发环境, 获取DuckDB连接
        return duckdb.connect(str(DB_PATH))
    else:
        pass
    
    

def execute_duckdb_query(query: str, params=None):
    """执行SQL查询并返回结果"""
    conn = get_connection()
    try:
        
        result = conn.execute(query).fetchdf()
        return result
    except Exception as e:
        raise e
    finally:
        conn.close()

def pd_read_sql(url, query, prepare_stmt=None):
    from sqlalchemy import create_engine, text
    import pandas as pd
    engine = create_engine(url)
    # with语句， 避免忘记close connection
    with engine.connect() as con:
        if prepare_stmt is not None:
            con.exec_driver_sql(prepare_stmt)

        # query = text(query).execution_options(no_parameters=True)
        query = text(query)
        df = pd.read_sql_query(query, con=con)
    return df

def execute_mysql_query(query, url, prepare_stmt=None):
    import pandas as pd
    engine = lambda query: pd_read_sql(url, query, prepare_stmt=prepare_stmt)

    try:
        # print("type:", type(query))
        df = engine(query)
    except Exception as e:
        df = pd.DataFrame([{"error": str(e)}])
    return df

def execute_query(query: str, params=None):
    import socket
    if socket.gethostname() == "Jiahaos-MacBook-Pro.local":
        return execute_duckdb_query(query,params)
    else:
        url = ""
        return execute_mysql_query(query,url, prepare_stmt='set query_mem_limit = 68719476736')


def init_db():
    """初始化数据库，创建示例表和数据"""
    conn = get_connection()
    try:
        # 创建示例销售数据表
        conn.execute("""
        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY,
            product_name VARCHAR,
            category VARCHAR,
            price DECIMAL(10, 2),
            quantity INTEGER,
            sale_date DATE,
            region VARCHAR
        )
        """)
        
        # 检查表是否为空，如果为空则插入示例数据
        count = conn.execute("SELECT COUNT(*) FROM sales").fetchone()[0]
        if count == 0:
            conn.execute("""
            INSERT INTO sales (id, product_name, category, price, quantity, sale_date, region)
            VALUES
                (1, '笔记本电脑', '电子产品', 5999.99, 10, '2023-01-15', '华东'),
                (2, '智能手机', '电子产品', 3999.99, 25, '2023-01-20', '华南'),
                (3, '耳机', '配件', 299.99, 50, '2023-01-25', '华北'),
                (4, '平板电脑', '电子产品', 2999.99, 15, '2023-02-05', '西南'),
                (5, '键盘', '配件', 199.99, 30, '2023-02-10', '西北'),
                (6, '鼠标', '配件', 99.99, 45, '2023-02-15', '华东'),
                (7, '显示器', '电子产品', 1499.99, 20, '2023-03-01', '华南'),
                (8, '打印机', '办公设备', 899.99, 8, '2023-03-10', '华北'),
                (9, '路由器', '网络设备', 399.99, 12, '2023-03-20', '西南'),
                (10, '移动硬盘', '存储设备', 499.99, 18, '2023-04-01', '西北'),
                (11, '笔记本电脑', '电子产品', 6999.99, 5, '2023-04-10', '华东'),
                (12, '智能手机', '电子产品', 4999.99, 15, '2023-04-20', '华南'),
                (13, '耳机', '配件', 399.99, 40, '2023-05-01', '华北'),
                (14, '平板电脑', '电子产品', 3499.99, 10, '2023-05-10', '西南'),
                (15, '键盘', '配件', 249.99, 25, '2023-05-20', '西北')
            """)
        print("数据库初始化完成")
    except Exception as e:
        print(f"数据库初始化错误: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    init_db() 