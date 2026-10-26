import mysql.connector
from mysql.connector.pooling import MySQLConnectionPool

db_pool = MySQLConnectionPool(
    pool_name="pool_name",
    pool_size=10,
    pool_reset_session=True,
    host="db_host",
    user="db_username",
    password="db_password",
    database="db_name"
)


def get_db():
    return db_pool.get_connection()
