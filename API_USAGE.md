# Budget Tracker API Documentation

## Add Expense Endpoint

### Endpoint Details
- **URL**: `/api/add-expense`
- **Method**: `POST`
- **Authentication**: Bearer Token

### Authentication
Include the API token in the Authorization header:
```
Authorization: Bearer budget_tracker_api_2025_secure_token_n8n
```

### Request Body
```json
{
  "tag": "lingyu 凌宇",
  "unit_price": 100,
  "quantity": 2,
  "description": "office supplies"
}
```

### Field Requirements
- **tag**: Member name (case-insensitive). If not found, expense will be created as unassigned.
- **unit_price**: Positive number (price per unit)
- **quantity**: Positive integer (number of units)
- **description**: Non-empty string

### Response Examples

#### Success (200)
```json
{
  "status": "success",
  "message": "Expense added successfully."
}
```

#### Missing Fields (400)
```json
{
  "status": "error",
  "message": "Missing required fields."
}
```

#### Invalid Values (400)
```json
{
  "status": "error",
  "message": "unit_price must be a positive number."
}
```

#### Unauthorized (401)
```json
{
  "status": "error",
  "message": "Unauthorized access."
}
```

### Example Usage

#### Using curl:
```bash
curl -X POST http://localhost:3001/api/add-expense \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer budget_tracker_api_2025_secure_token_n8n" \
  -d '{
    "tag": "lingyu 凌宇",
    "unit_price": 100,
    "quantity": 2,
    "description": "office supplies"
  }'
```

#### Using JavaScript fetch:
```javascript
const response = await fetch('/api/add-expense', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer budget_tracker_api_2025_secure_token_n8n'
  },
  body: JSON.stringify({
    tag: 'lingyu 凌宇',
    unit_price: 100,
    quantity: 2,
    description: 'office supplies'
  })
});

const result = await response.json();
console.log(result);
```

### N8N Configuration
1. Use HTTP Request node
2. Set method to POST
3. Set URL to your domain + `/api/add-expense`
4. Add header: `Authorization: Bearer budget_tracker_api_2025_secure_token_n8n`
5. Set body to JSON with the required fields

### Notes
- Expenses are automatically dated with current Beijing time
- Total amount is calculated as `unit_price × quantity`
- Member matching is case-insensitive
- If member is not found, expense is created as unassigned but still recorded 