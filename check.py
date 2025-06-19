from flask import Flask, request, jsonify
from google.cloud import bigquery

app = Flask(__name__)
client = bigquery.Client()

@app.route('/api/nutrients', methods=['GET'])
def get_nutrients():
    food = request.args.get('food')
    if not food:
        return jsonify({'error': 'Missing food parameter'}), 400

    query = """
    SELECT *
    FROM `nutrition-463318.nutrition_data.nutrition_table`
    WHERE LOWER(food_name) = @food_name
    LIMIT 1
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("food_name", "STRING", food.lower())
        ]
    )
    query_job = client.query(query, job_config=job_config)
    results = [dict(row) for row in query_job.result()]

    if not results:
        return jsonify({'error': 'Food not found'}), 404

    return jsonify(results[0])

if __name__ == '__main__':
    app.run(debug=True)