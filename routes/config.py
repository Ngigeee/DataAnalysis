import mysql.connector
from mysql.connector.pooling import MySQLConnectionPool

db_pool = MySQLConnectionPool(
    pool_name="kijarney",
    pool_size=10,
    pool_reset_session=True,
    host="localhost",
    user="root",
    password="",
    database="DataAnalysis"
)


def get_db():
    return db_pool.get_connection()
