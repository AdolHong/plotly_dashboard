import duckdb
import os
from pathlib import Path

# 数据库文件路径
DB_PATH = Path(__file__).parent.parent.parent / "data" / "dashboard.duckdb"

# 确保数据目录存在
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

def get_connection():
    """获取DuckDB连接"""
    return duckdb.connect(str(DB_PATH))

def execute_query(query: str, params=None):
    """执行SQL查询并返回结果"""
    conn = get_connection()
    try:
        if params:
            result = conn.execute(query, params).fetchdf()
        else:
            result = conn.execute(query).fetchdf()
        return result
    except Exception as e:
        raise e
    finally:
        conn.close()

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
            
            # 创建示例用户数据表
            conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                username VARCHAR,
                age INTEGER,
                gender VARCHAR,
                registration_date DATE,
                last_login DATE,
                active BOOLEAN
            )
            """)
            
            conn.execute("""
            INSERT INTO users (id, username, age, gender, registration_date, last_login, active)
            VALUES
                (1, '张三', 28, '男', '2023-01-05', '2023-06-01', true),
                (2, '李四', 35, '男', '2023-01-10', '2023-06-02', true),
                (3, '王五', 22, '女', '2023-01-15', '2023-06-01', true),
                (4, '赵六', 45, '男', '2023-02-01', '2023-05-20', false),
                (5, '钱七', 31, '女', '2023-02-10', '2023-06-03', true),
                (6, '孙八', 27, '男', '2023-02-20', '2023-05-15', false),
                (7, '周九', 39, '女', '2023-03-05', '2023-06-02', true),
                (8, '吴十', 42, '男', '2023-03-15', '2023-06-01', true),
                (9, '郑十一', 25, '女', '2023-04-01', '2023-05-10', false),
                (10, '王十二', 33, '男', '2023-04-15', '2023-06-03', true)
            """)
            
        print("数据库初始化完成")
    except Exception as e:
        print(f"数据库初始化错误: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    init_db() 