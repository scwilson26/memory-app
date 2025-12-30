import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import OpenAI from 'openai';

// TODO: Replace with your OpenAI API key
const OPENAI_API_KEY = 'YOUR_API_KEY_HERE';

const extractionPrompt = `You are a memory extraction assistant. Extract a single memory fact from user input.
Return ONLY valid JSON with these exact fields:
- type: "Fact"
- what: brief name of the fact (e.g., "favorite color")
- value: the fact value (e.g., "blue")
- expires: "Never"

Example: "Remember my favorite color is blue"
Output: {"type": "Fact", "what": "favorite color", "value": "blue", "expires": "Never"}

If you cannot extract a clear fact, return: {"error": "unclear"}`;

const recallPrompt = (memories, question) => `You are a memory recall assistant. The user has these memories stored:

${memories.map(m => `- ${m.what}: ${m.value}`).join('\n')}

User question: "${question}"

Answer the question using the stored memories. If the answer is in the memories, provide it clearly. If not, say you don't have that information stored.`;

export default function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('Memory app ready.\nTry: "Remember my favorite food is pizza"');
  const [loading, setLoading] = useState(false);
  const [memories, setMemories] = useState([]);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setOutput('Processing...');

    try {
      const client = new OpenAI({
        apiKey: OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      });

      // Check if user wants to recall a memory (asking a question)
      const isQuestion = input.toLowerCase().startsWith('what') ||
                        input.toLowerCase().startsWith('where') ||
                        input.toLowerCase().startsWith('when') ||
                        input.toLowerCase().startsWith('who') ||
                        input.toLowerCase().startsWith('how') ||
                        input.includes('?');

      if (isQuestion && memories.length > 0) {
        // Recall mode
        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: recallPrompt(memories, input) },
            { role: 'user', content: input }
          ],
          temperature: 0.3
        });

        const answer = response.choices[0].message.content.trim();
        setOutput(`Answer:\n\n${answer}`);
        setInput('');
      } else {
        // Extraction mode
        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: extractionPrompt },
            { role: 'user', content: input }
          ],
          temperature: 0.0
        });

        const result = response.choices[0].message.content.trim();
        const memory = JSON.parse(result);

        if (memory.error) {
          setOutput('Could not extract memory.\nTry: "Remember that <fact> is <value>"');
        } else {
          const newMemory = {
            id: Date.now(),
            type: memory.type,
            what: memory.what,
            value: memory.value,
            expires: memory.expires,
            createdAt: new Date().toISOString()
          };
          setMemories(prev => [...prev, newMemory]);
          setOutput(`Memory saved!\n\nType: ${memory.type}\nWhat: ${memory.what}\nValue: ${memory.value}\nExpires: ${memory.expires}\n\nTotal memories: ${memories.length + 1}`);
          setInput('');
        }
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Memory App</Text>

      <TextInput
        style={styles.input}
        placeholder="Type something to remember..."
        value={input}
        onChangeText={setInput}
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Processing...' : 'Extract Memory'}
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.outputContainer}>
        <Text style={styles.output}>{output}</Text>
      </ScrollView>

      <View style={styles.memoriesSection}>
        <Text style={styles.memoriesTitle}>Saved Memories ({memories.length})</Text>
        <ScrollView style={styles.memoriesList}>
          {memories.length === 0 ? (
            <Text style={styles.noMemories}>No memories saved yet</Text>
          ) : (
            memories.map(mem => (
              <View key={mem.id} style={styles.memoryItem}>
                <Text style={styles.memoryWhat}>{mem.what}</Text>
                <Text style={styles.memoryValue}>{mem.value}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  outputContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
  },
  output: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  memoriesSection: {
    marginTop: 20,
    flex: 1,
  },
  memoriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  memoriesList: {
    flex: 1,
  },
  noMemories: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  memoryItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  memoryWhat: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  memoryValue: {
    fontSize: 14,
    color: '#666',
  },
});
