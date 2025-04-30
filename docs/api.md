# TrackXpense API Documentation

This document provides information about the TrackXpense API endpoints and how to use them.

## Base URL

The base URL for all API endpoints is:

```
https://localhost:8000/api
```

Or when using HTTP:

```
http://localhost:8000/api
```

## Authentication

Most API endpoints require authentication. The API uses Firebase Authentication and expects a valid Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

## API Endpoints

### OCR Endpoints

#### Process Receipt

Processes a receipt image and extracts structured data.

- **URL**: `/ocr/process-receipt`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `image`: The receipt image file

**Example Request**:
```bash
curl -X POST https://localhost:8000/api/ocr/process-receipt \
  -H "Authorization: Bearer <firebase-id-token>" \
  -F "image=@receipt.jpg"
```

**Example Response**:
```json
{
  "vendor": "GROCERY STORE",
  "date": "2023-05-15",
  "total": 45.67,
  "category": "Groceries",
  "confidence": 0.92,
  "items": [
    {
      "name": "Milk",
      "quantity": 1,
      "price": 3.99
    },
    {
      "name": "Bread",
      "quantity": 2,
      "price": 2.49
    }
  ]
}
```

#### Predict Category

Predicts the expense category based on receipt data.

- **URL**: `/ocr/predict-category`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**:
  - `vendor`: The vendor name
  - `items`: List of item names
  - `total`: The total amount

**Example Request**:
```bash
curl -X POST https://localhost:8000/api/ocr/predict-category \
  -H "Authorization: Bearer <firebase-id-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor": "GROCERY STORE",
    "items": ["Milk", "Bread", "Eggs"],
    "total": 12.99
  }'
```

**Example Response**:
```json
{
  "category": "Groceries",
  "confidence": 0.95
}
```

### Receipt Endpoints

#### Get All Receipts

Retrieves all receipts for the authenticated user.

- **URL**: `/receipts`
- **Method**: `GET`
- **Query Parameters**:
  - `limit` (optional): Maximum number of receipts to return
  - `offset` (optional): Number of receipts to skip
  - `category` (optional): Filter by category
  - `start_date` (optional): Filter by start date (YYYY-MM-DD)
  - `end_date` (optional): Filter by end date (YYYY-MM-DD)

**Example Request**:
```bash
curl -X GET "https://localhost:8000/api/receipts?limit=10&category=Groceries" \
  -H "Authorization: Bearer <firebase-id-token>"
```

**Example Response**:
```json
{
  "receipts": [
    {
      "id": "rec123",
      "vendor": "GROCERY STORE",
      "date": "2023-05-15",
      "total": 45.67,
      "category": "Groceries",
      "items": [
        {
          "name": "Milk",
          "quantity": 1,
          "price": 3.99
        }
      ]
    }
  ],
  "total_count": 1
}
```

#### Get Receipt by ID

Retrieves a specific receipt by ID.

- **URL**: `/receipts/{receipt_id}`
- **Method**: `GET`

**Example Request**:
```bash
curl -X GET https://localhost:8000/api/receipts/rec123 \
  -H "Authorization: Bearer <firebase-id-token>"
```

**Example Response**:
```json
{
  "id": "rec123",
  "vendor": "GROCERY STORE",
  "date": "2023-05-15",
  "total": 45.67,
  "category": "Groceries",
  "items": [
    {
      "name": "Milk",
      "quantity": 1,
      "price": 3.99
    }
  ]
}
```

#### Create Receipt

Creates a new receipt.

- **URL**: `/receipts`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**:
  - `vendor`: The vendor name
  - `date`: The receipt date (YYYY-MM-DD)
  - `total`: The total amount
  - `category`: The expense category
  - `items` (optional): List of items

**Example Request**:
```bash
curl -X POST https://localhost:8000/api/receipts \
  -H "Authorization: Bearer <firebase-id-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor": "GROCERY STORE",
    "date": "2023-05-15",
    "total": 45.67,
    "category": "Groceries",
    "items": [
      {
        "name": "Milk",
        "quantity": 1,
        "price": 3.99
      }
    ]
  }'
```

**Example Response**:
```json
{
  "id": "rec123",
  "vendor": "GROCERY STORE",
  "date": "2023-05-15",
  "total": 45.67,
  "category": "Groceries",
  "items": [
    {
      "name": "Milk",
      "quantity": 1,
      "price": 3.99
    }
  ]
}
```

#### Update Receipt

Updates an existing receipt.

- **URL**: `/receipts/{receipt_id}`
- **Method**: `PUT`
- **Content-Type**: `application/json`
- **Request Body**: Same as Create Receipt

**Example Request**:
```bash
curl -X PUT https://localhost:8000/api/receipts/rec123 \
  -H "Authorization: Bearer <firebase-id-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor": "GROCERY STORE",
    "date": "2023-05-15",
    "total": 48.99,
    "category": "Groceries",
    "items": [
      {
        "name": "Milk",
        "quantity": 1,
        "price": 3.99
      },
      {
        "name": "Eggs",
        "quantity": 1,
        "price": 5.99
      }
    ]
  }'
```

**Example Response**:
```json
{
  "id": "rec123",
  "vendor": "GROCERY STORE",
  "date": "2023-05-15",
  "total": 48.99,
  "category": "Groceries",
  "items": [
    {
      "name": "Milk",
      "quantity": 1,
      "price": 3.99
    },
    {
      "name": "Eggs",
      "quantity": 1,
      "price": 5.99
    }
  ]
}
```

#### Delete Receipt

Deletes a receipt.

- **URL**: `/receipts/{receipt_id}`
- **Method**: `DELETE`

**Example Request**:
```bash
curl -X DELETE https://localhost:8000/api/receipts/rec123 \
  -H "Authorization: Bearer <firebase-id-token>"
```

**Example Response**:
```json
{
  "message": "Receipt deleted successfully"
}
```

## Error Responses

The API returns appropriate HTTP status codes and error messages in case of errors:

- **400 Bad Request**: Invalid request parameters or body
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

Example error response:
```json
{
  "error": "Bad Request",
  "message": "Invalid receipt data",
  "details": "Total amount must be a positive number"
}
```

## API Documentation

For a more detailed API documentation, you can access the Swagger UI at:

```
https://localhost:8000/docs
```

Or the ReDoc documentation at:

```
https://localhost:8000/redoc
```
