import os
import mysql.connector
from mysql.connector.pooling import MySQLConnectionPool

db_pool = MySQLConnectionPool(
    pool_name="Kijarney",
    pool_size=10,
    pool_reset_session=True,
    host=os.getenv("DB_HOST", "localhost"),
    port=int(os.getenv("DB_PORT", "3306")),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME")
)

def get_db():
    return db_pool.get_connection()