# 跑测试
python -m unittest tests/test_cascade_options.py

# 启动程序
poetry run uvicorn main:app --reload --host 0.0.0.0 --port 8000
