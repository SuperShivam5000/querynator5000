interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const POLLINATIONS_URL = 'https://text.pollinations.ai/';

async function getChatCompletion(messages: Message[]): Promise<string> {
  const response = await fetch(POLLINATIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      "model": "openai-large",
      "messages": messages,
      "referrer": "querynator5000"
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Server error: ${response.status} - ${errorText}`);
  }

  const result = await response.text();
  return result;
}

export const generateSQLQuery = async (
  naturalLanguageQuery: string,
  schema: Array<{
    name: string;
    columns: Array<{
      name: string;
      type: string;
      nullable: boolean;
      primaryKey: boolean;
    }>;
  }>
): Promise<string> => {
  const schemaDescription = schema.map(table => {
    const columns = table.columns.map(col => {
      const constraints = [];
      if (col.primaryKey) constraints.push('PRIMARY KEY');
      if (!col.nullable) constraints.push('NOT NULL');
      return `${col.name} ${col.type}${constraints.length > 0 ? ' (' + constraints.join(', ') + ')' : ''}`;
    }).join(', ');
    
    return `Table: ${table.name}\nColumns: ${columns}`;
  }).join('\n\n');

  const prompt = `Given the following database schema, generate a SQL query for the request: "${naturalLanguageQuery}"

Database Schema:
${schemaDescription}

Requirements:
- Generate only the SQL query, no explanations
- Use proper SQL syntax compatible with SQLite
- If the request is ambiguous, make reasonable assumptions
- Include appropriate JOINs when needed
- Use proper column names and table names as specified in the schema
- Return only the SQL query without any markdown formatting or additional text

SQL Query:`;

  try {
    const messages: Message[] = [
      {
        role: 'system',
        content: 'You are a SQL expert. Generate only SQL queries without any explanations or markdown formatting.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    console.log('LLM messages:', JSON.stringify(messages, null, 2));
    const sqlQuery = await getChatCompletion(messages);
    
    if (!sqlQuery) {
      throw new Error('No SQL query generated');
    }

    // Clean up the response to ensure it's just the SQL query
    return sqlQuery.trim().replace(/```sql|```/g, '').trim();
  } catch (error) {
    console.error('Pollinations AI API error:', error);
    throw new Error('Failed to generate SQL query. Please try again.');
  }
};