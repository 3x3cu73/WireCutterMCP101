import logging

from distutils.util import execute
import time , secrets

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status, Response , Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Generator, List, Optional, Tuple
from contextlib import contextmanager
from datetime import datetime
import os
import json
import base64
import hashlib
import mysql.connector
from mysql.connector import pooling
from google import genai
from google.genai import types
from starlette.middleware.base import BaseHTTPMiddleware
from routers import health, devloper, cpu
from typing import List, Dict


# ----------------------
# CONFIG AND SETUP
# ----------------------




# FastAPI app
app = FastAPI(root_path="/api")

#HEalth Check Routing
app.include_router(health.router)
app.include_router(devloper.router)

app.include_router(cpu.router)







# Create upload directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Database connection pool configuration
db_config = {
    "pool_name": "mypool",
    "pool_size": 32,
    "host": "vmhost",
    "user": "sumit",
    "password": "Sumitocs@326#u",
    "database": "ocs",
    "auth_plugin": 'mysql_native_password'
}

# Create connection pool
connection_pool = mysql.connector.pooling.MySQLConnectionPool(**db_config)


db_config_wireCutter = {
    "pool_name": "mypool",
    "pool_size":32 ,
    "host": "vmhost",
    "user": "sumit",
    "password": "Sumitocs@326#u",
    "database": "mcp101",
    "auth_plugin": 'mysql_native_password'
}

connection_pool_wireCutter = mysql.connector.pooling.MySQLConnectionPool(**db_config_wireCutter)


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------
# PYDANTIC MODELS
# ----------------------

class UserBase(BaseModel):
    userid: str
    role: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    cur_role: str
    all_users: List[Tuple]
    status: str


# ----------------------
# DATABASE UTILITIES
# ----------------------



@contextmanager
def get_db_cursor():
    connection = connection_pool.get_connection()
    cursor = connection.cursor()
    try:
        yield cursor
        connection.commit()
    except Exception as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    finally:
        cursor.close()
        connection.close()

class UserService:
    @staticmethod
    def get_role(cursor, userid: str, hashed_password: str) -> Optional[str]:
        select_query = "SELECT role, password_hash FROM users WHERE userid = %s"
        cursor.execute(select_query, (userid,))
        result = cursor.fetchone()

        if result and result[1] == hashed_password:
            return result[0]
        return None

    @staticmethod
    def get_user_data(cursor, user_id: str) -> List[Tuple]:
        select_query = "SELECT userid, password_hash, role FROM users WHERE userid = %s"
        cursor.execute(select_query, (user_id,))
        return cursor.fetchall()

    @staticmethod
    def get_all_users(cursor) -> List[Tuple]:
        select_query = "SELECT userid, password_hash, role FROM users"
        cursor.execute(select_query)
        return cursor.fetchall()



# Database connection pool configuration





@contextmanager
def get_db_cursor_wireCutter():
    connection = connection_pool_wireCutter.get_connection()
    cursor = connection.cursor()
    try:
        yield cursor
        connection.commit()
    except Exception as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    finally:
        cursor.close()
        connection.close()


class WireCutter:
    @staticmethod
    def get_jobs_queue()->list[List]:
        select_query = """
SELECT jobs.*, `rank`.jobRank
FROM jobs
JOIN `rank` ON jobs.jobid = `rank`.jobid
ORDER BY `rank`.jobRank DESC;

        """
        with get_db_cursor_wireCutter() as cursor:
            cursor.execute(select_query)
            result = cursor.fetchall()
        return result






# ----------------------
# CAPTCHA FUNCTIONALITY
# ----------------------

def generate(image_data):
    ans = ""
    client = genai.Client(
        api_key="AIzaSyAypqvoB15Z7vK_fhSwLWMDytHUo4Zf3us",
    )
    image1 = types.Part.from_bytes(
        data=base64.b64decode(image_data),
        mime_type="image/png",
    )

    model = "gemini-2.0-flash-lite-001"
    contents = [
        types.Content(
            role="user",
            parts=[image1],
        ),
    ]

    generate_content_config = types.GenerateContentConfig(
        temperature=2,
        top_p=0.95,
        top_k=40,
        max_output_tokens=8192,
        response_mime_type="text/plain",
        system_instruction=[
            types.Part.from_text(
                text="""return single word as captcha of length 6, it contains some noise light grey line and a bit thicker text and it consists only alphabet and numbers"""
            ),
        ],
    )

    for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
    ):
        ans += chunk.text

    return ans


# ----------------------
# MIDDLEWARE
# ----------------------

@app.middleware("http")
async def db_session_middleware(request, call_next):
    response = await call_next(request)
    return response


# ----------------------
# TEST ENDPOINTS
# ----------------------

@app.get("/first")
def first_endpoint():
    response = Response(
        status_code=200,
        content=None,
    )
    response.headers["Content-Type"] = "application/json"
    response.headers["Authorization"] = "Bearer token123"
    return response


@app.get("/second")
def second_endpoint():
    body = {
        "param1": "value1",
        "param2": "value2"
    }
    response = Response(
        status_code=400,
        media_type="application/json",
        content=json.dumps(body)
    )
    response.headers["Content-Type"] = "application/json"
    response.headers["Authorization"] = "Bearer token123"
    return response


# ----------------------
# AUTH ENDPOINTS
# ----------------------

@app.post("/ocs/login", response_model=UserResponse)
def login(username: str, password: str):
    with get_db_cursor() as cursor:
        try:
            role = UserService.get_role(cursor, username, password)

            if role == "admin":
                return UserResponse(
                    cur_role="admin",
                    all_users=UserService.get_all_users(cursor),
                    status="Success"
                )
            elif role:
                return UserResponse(
                    cur_role="basic",
                    all_users=UserService.get_user_data(cursor, username),
                    status="Success"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Invalid credentials"
                )
        except mysql.connector.Error as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )


# ----------------------
# CAPTCHA ENDPOINT
# ----------------------

@app.get("/captcha")
def captcha(image_data: str):
    try:
        ans = generate(image_data).strip()
    except:
        ans = "Failed"
    return ans


# ----------------------
# FILE MANAGEMENT ENDPOINTS
# ----------------------

@app.post("/store")
async def store_files(files: List[UploadFile] = File(...)):
    """Upload and save multiple files."""
    for file in files:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())
    return Response(status_code=200)


@app.get("/retrieve/{filename}")
async def retrieve_file(filename: str):
    """Retrieve a stored file by name."""
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(path=file_path)
    else:
        return Response(status_code=404)


@app.delete("/delete/{filename}")
async def delete_file(filename: str):
    """Delete a stored file by name."""
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        return Response(status_code=200)
    else:
        return Response(status_code=404)




# ----------------------
# MCP101 Project
# ----------------------

@app.get("/mcp101")
def get_jobs():
    """Get all jobs from the database."""
    try:
        jobs = WireCutter.get_jobs_queue()
        return {"jobs": jobs}
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
@app.get("/mcp101/{job_id}")
def get_job(job_id: str):
    """Get a specific job by ID."""
    try:
        with get_db_cursor_wireCutter() as cursor:
            select_query = "SELECT * FROM jobs WHERE id = %s"
            cursor.execute(select_query, (job_id,))
            job = cursor.fetchone()
            if job:
                return {"job": job}
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Job not found"
                )
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
@app.post("/mcp101")
def create_job(job: dict):
    """Create a new job."""
    jobid=time.time()
    # jobRankNew=get_db_cursor_wireCutter(" SELECT jobRank FROM `rank` ORDER BY jobRank DESC LIMIT 1 ;")
    try:
        with get_db_cursor_wireCutter() as cursor:
            select_query = "SELECT jobRank FROM `rank`  ORDER BY jobRank DESC LIMIT 1"
            cursor.execute(select_query)
            result = cursor.fetchone()
            if result:
                jobRankNew = result[0]
            else:
                jobRankNew = 0
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    # jobRankNew=jobRankNew[0]
    try:
        with get_db_cursor_wireCutter() as cursor:
            insert_query = "INSERT INTO `rank` (jobid,jobRank) VALUES (%s,%s)"
            cursor.execute(insert_query, (jobid,jobRankNew+1))

        with get_db_cursor_wireCutter() as cursor:
            insert_query = "INSERT INTO jobs (jobid, user, a, b, c, title, description) VALUES (%s, %s, %s, %s, %s, %s, %s)"
            cursor.execute(
    insert_query,
    (
        jobid,        # Integer value for jobid
        job["user"],         # String value for user
        job["a"],            # Integer value for a
        job["b"],            # Integer value for b
        job["c"],            # Integer value for c
        job["title"],         # String value for name
        job["description"]   # String value for description
    )
)

            return {"status": "Job created successfully"}
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
@app.put("/mcp101/{job_id}")
def update_job(job_id: str, job: dict):
    """Update an existing job."""
    try:
        with get_db_cursor_wireCutter() as cursor:
            update_query = "UPDATE jobs SET title = %s, description = %s , a=%s , b=%s , c=%s WHERE jobid = %s"
            cursor.execute(update_query, (job["title"], job["description"],job["a"],job["b"],job["c"], job_id))
            return {"status": "Job updated successfully"}
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


class JobRankItem(BaseModel):
    jobRank: int
    jobid: str

@app.post("/mcp101/rank")
async def update_job_ranks(jobrank_list: List[JobRankItem]):
    try:
        with get_db_cursor_wireCutter() as cursor:
            update_query = "UPDATE `rank` SET jobRank = %s WHERE jobid = %s"
            for job_rank_item in jobrank_list:
                cursor.execute(update_query, (job_rank_item.jobRank, job_rank_item.jobid))
            # cursor.connection.commit()  # Commit all updates in a single transaction
            return {"status": "Job ranks updated successfully"}
    except mysql.connector.Error as e :
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )


class controllerData(BaseModel):
    label: str
    info: str

@app.post("/mcp101/status")
async def updateStatus(controller_data: List[controllerData]):
    timeUp = time.time()
    info_json = json.dumps([item.dict() for item in controller_data])
    try:
        with get_db_cursor_wireCutter() as cursor:
            # Check if there's any entry in the table
            cursor.execute("SELECT COUNT(*) FROM `statusTable`")
            count = cursor.fetchone()[0]

            if count == 0:
                # Insert if no entry
                insert_query = "INSERT INTO `statusTable` (`time`,`info`) VALUES (%s, %s)"
                cursor.execute(insert_query, (timeUp, info_json))
                # cursor.connection.commit()  # Explicitly commit the insertion
                return {"status": "Info Uploaded successfully (first entry)"}
            else:
                # Update the last entry
                update_query = "UPDATE `statusTable` SET `time` = %s, `info` = %s ORDER BY `time` DESC LIMIT 1"
                cursor.execute(update_query, (timeUp, info_json))
                # cursor.connection.commit()  # Explicitly commit the update
                return {"status": "Last entry updated successfully"}
    except mysql.connector.Error as e :
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )

@app.get("/mcp101/status/last")
def get_status():
    """Get all jobs from the database."""
    try:
        select_query = "SELECT * FROM `statusTable` ORDER BY time DESC LIMIT 1"
        with get_db_cursor_wireCutter() as cursor:
            cursor.execute(select_query)
            result = cursor.fetchall()
            return {"time":int(float(result[0][1])),"data":json.loads(result[0][2])}
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )



@app.delete("/mcp101/{job_id}")
def delete_job(job_id: str):
    """Delete a job by ID."""
    try:
        with get_db_cursor_wireCutter() as cursor:
            delete_query = "DELETE FROM jobs WHERE jobid = %s"
            cursor.execute(delete_query, (job_id,))
            return {"status": "Job deleted successfully"}
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )



@app.post("/mcp101/login")
def setToken(userCredentials:dict):
    user=userCredentials["username"]
    password_hash=userCredentials["password_hash"]
    try:
        with get_db_cursor_wireCutter() as cursor:
            select_query = "SELECT role, password_hash FROM users WHERE username = %s"
            cursor.execute(select_query, (user,))
            result = cursor.fetchone()


            if result and result[1] == password_hash:
                secretToken=secrets.token_urlsafe(64)
                update_query="UPDATE users SET sessionId = %s WHERE username = %s"
                cursor.execute(update_query,(secretToken,user))
                return {"status": "Success","token":secretToken,"role":result[0]}
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Invalid credentials"
                )
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

# @app.get("/mcp101/login")
# def getToken(user):
#     try:
#         with get_db_cursor_wireCutter() as cursor:
#             get_query = "SELECT role,sessionid FROM users WHERE username = %s"
#             cursor.execute(get_query, (user,))
#             result= cursor.fetchone()
#             if result:
#                 return {"role":result.role,"sessionid":result.sessionid}
#             else:
#                 raise HTTPException(
#                     status_code=status.HTTP_404_NOT_FOUND,
#                     detail="User not found"
#                 )
#     except mysql.connector.Error as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Database error: {str(e)}"
#         )

@app.post("/mcp101/getSessionId")
def getToken(user):
    try:
        with get_db_cursor_wireCutter() as cursor:
            select_query = "SELECT role,sessionId FROM users WHERE username = %s"
            cursor.execute(select_query, (user,))
            result = cursor.fetchone()
            if result:
                return {"role": result[0], "sessionId": result[1]}
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@app.post("/mcp101/register")
def registeruser(userCredentials:dict):
    logging.info(userCredentials)

    username=userCredentials["username"]
    password_hash=userCredentials["password_hash"]
    email=userCredentials["email"]
    name=userCredentials["name"]
    # cosole.log(userCredentials)

    try:
        with get_db_cursor_wireCutter() as cursor:
            select_query = "SELECT COUNT(*) FROM users WHERE username = %s"
            cursor.execute(select_query, (username,))
            result = cursor.fetchone()
            if result[0] > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User already exists"
                )
            else:
                insert_query = "INSERT INTO users (username, password_hash, email,name) VALUES (%s, %s, %s,%s)"
                cursor.execute(insert_query, (username, password_hash, email,name))
                return {"status": "User registered successfully"}
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )



# ----------------------
# COnfiguration
# ----------------------

# @app.get("/health")
# def health_check():
#     return {"status": "healthy", "timestamp": datetime.now()}
