import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useState, useEffect, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OpenAI from 'openai';
import {
  AI_MODEL,
  API_TIMEOUT,
  EXTRACTION_TEMPERATURE,
  RECALL_TEMPERATURE,
  STORAGE_KEY,
  INITIAL_MESSAGE,
  EXTRACTION_PROMPT,
  createRecallPrompt
} from './constants';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export default function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState(INITIAL_MESSAGE);
  const [loading, setLoading] = useState(false);
  const [memories, setMemories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editWhat, setEditWhat] = useState('');
  const [editValue, setEditValue] = useState('');

  // Track if this is the first render to avoid saving on initial load
  const isFirstRender = useRef(true);

  // Create OpenAI client (memoized to avoid recreation on every render)
  const client = useMemo(() => {
    if (!OPENAI_API_KEY) return null;
    return new OpenAI({
      apiKey: OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
      timeout: API_TIMEOUT
    });
  }, []);

  // Load memories from storage on app start
  useEffect(() => {
    loadMemories();
  }, []);

  // Save memories to storage whenever they change (skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveMemories();
  }, [memories]);

  const loadMemories = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        setMemories(parsed);
        setOutput(`Memory app ready.\n${parsed.length} memories loaded.`);
      }
    } catch (error) {
      console.error('Error loading memories:', error);
      setOutput('Memory app ready.\nError loading saved memories.');
    }
  };

  const saveMemories = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
    } catch (error) {
      console.error('Error saving memories:', error);
      // Show user-facing error if save fails
      setOutput('Warning: Failed to save memories to storage. Your changes may be lost.');
    }
  };

  const deleteMemory = (id) => {
    const memory = memories.find(mem => mem.id === id);
    if (!memory) return;

    // Use native Alert for mobile, window.confirm for web
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${memory.what}"?`)) {
        setMemories(prev => prev.filter(mem => mem.id !== id));
      }
    } else {
      Alert.alert(
        'Delete Memory',
        `Delete "${memory.what}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => setMemories(prev => prev.filter(mem => mem.id !== id))
          }
        ]
      );
    }
  };

  const editMemory = (id, newWhat, newValue) => {
    // Validate inputs aren't empty
    if (!newWhat.trim() || !newValue.trim()) {
      setOutput('Memory fields cannot be empty.');
      return;
    }

    setMemories(prev => prev.map(mem =>
      mem.id === id ? { ...mem, what: newWhat, value: newValue } : mem
    ));
  };

  const exportMemories = () => {
    const dataStr = JSON.stringify(memories, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `memories-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setOutput(`Exported ${memories.length} memories.`);
  };

  const importMemories = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported)) {
          setMemories(imported);
          setOutput(`Imported ${imported.length} memories.`);
        } else {
          setOutput('Invalid backup file format.');
        }
      } catch (error) {
        setOutput('Failed to import memories.');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;

    // Check for API key
    if (!client) {
      setOutput('API key not configured. Please add your OpenAI API key to the .env file.');
      return;
    }

    setLoading(true);
    setOutput('Processing...');

    try {
      // First, ask AI to classify if this is a question or statement
      const classificationResponse = await client.chat.completions.create({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Respond with only "question" or "statement". Classify the user input as a question (asking for information) or a statement (providing information to remember).'
          },
          { role: 'user', content: input }
        ],
        temperature: 0.0
      });

      const classification = classificationResponse.choices[0].message.content.trim().toLowerCase();
      const isQuestion = classification === 'question';

      if (isQuestion && memories.length > 0) {
        // Recall mode
        const response = await client.chat.completions.create({
          model: AI_MODEL,
          messages: [
            { role: 'system', content: createRecallPrompt(memories, input) },
            { role: 'user', content: input }
          ],
          temperature: RECALL_TEMPERATURE
        });

        const answer = response.choices[0].message.content.trim();
        setOutput(answer);
        setInput('');
      } else {
        // Extraction mode
        const response = await client.chat.completions.create({
          model: AI_MODEL,
          messages: [
            { role: 'system', content: EXTRACTION_PROMPT },
            { role: 'user', content: input }
          ],
          temperature: EXTRACTION_TEMPERATURE
        });

        const result = response.choices[0].message.content.trim();

        // Try to parse JSON response
        let memory;
        try {
          memory = JSON.parse(result);
        } catch (parseError) {
          setOutput('Received invalid response from AI. Please try again.');
          setLoading(false);
          return;
        }

        if (memory.error) {
          setOutput('Could not extract memory.\nTry: "Remember that <fact> is <value>"');
        } else {
          const newMemory = {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            type: memory.type,
            what: memory.what,
            value: memory.value,
            expires: memory.expires,
            createdAt: new Date().toISOString()
          };
          setMemories(prev => [...prev, newMemory]);
          setOutput(`Saved: ${memory.what} · ${memory.value}`);
          setInput('');
        }
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);

      // Handle specific error types with calm, minimal messages
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        setOutput('No internet connection.');
      } else if (error.status === 401 || error.message?.includes('API key')) {
        setOutput('Invalid API key.');
      } else if (error.status === 429) {
        setOutput('Rate limit reached. Wait a moment.');
      } else if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
        setOutput('Request timed out.');
      } else if (error.status >= 500) {
        setOutput('Service temporarily unavailable.');
      } else {
        setOutput(`Error: ${error.message || 'Something went wrong.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Remember something or ask a question..."
        value={input}
        onChangeText={setInput}
        editable={!loading}
        multiline={Platform.OS !== 'web'}
        onSubmitEditing={Platform.OS === 'web' ? handleSubmit : undefined}
        onKeyPress={(e) => {
          if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? '...' : 'Submit'}
        </Text>
      </TouchableOpacity>

      {output && output !== INITIAL_MESSAGE && (
        <View style={styles.responseContainer}>
          <Text style={styles.response}>{output}</Text>
        </View>
      )}

      <View style={styles.memoriesSection}>
        <View style={styles.memoriesHeader}>
          <Text style={styles.memoriesCount}>{memories.length} memories</Text>
          {Platform.OS === 'web' && (
            <View style={styles.backupButtons}>
              <TouchableOpacity
                style={styles.backupButton}
                onPress={exportMemories}
              >
                <Text style={styles.backupButtonText}>Export</Text>
              </TouchableOpacity>
              <label htmlFor="import-file" style={{ cursor: 'pointer' }}>
                <View style={styles.backupButton}>
                  <Text style={styles.backupButtonText}>Import</Text>
                </View>
              </label>
              <input
                id="import-file"
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={importMemories}
              />
            </View>
          )}
        </View>
        <ScrollView style={styles.memoriesList}>
          {memories.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No memories yet.</Text>
              <Text style={styles.emptyStateHint}>Try: "Remember my favorite color is blue"</Text>
            </View>
          ) : (
            memories.map(mem => (
            <View key={mem.id} style={styles.memoryItem}>
              {editingId === mem.id ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={editWhat}
                    onChangeText={setEditWhat}
                    placeholder="what"
                  />
                  <Text style={styles.editSeparator}>·</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editValue}
                    onChangeText={setEditValue}
                    placeholder="value"
                  />
                  <View style={styles.editButtons}>
                    <TouchableOpacity
                      style={styles.editSaveButton}
                      onPress={() => {
                        editMemory(mem.id, editWhat, editValue);
                        setEditingId(null);
                      }}
                    >
                      <Text style={styles.editButtonText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.editCancelButton}
                      onPress={() => setEditingId(null)}
                    >
                      <Text style={styles.editCancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.memoryContent}>
                  <View style={styles.memoryTextContainer}>
                    <Text style={styles.memoryText}>
                      <Text style={styles.memoryWhat}>{mem.what}</Text>
                      <Text style={styles.memorySeparator}> · </Text>
                      <Text style={styles.memoryValue}>{mem.value}</Text>
                    </Text>
                    <Text style={styles.memoryTimestamp}>
                      {new Date(mem.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                  <View style={styles.memoryActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        setEditingId(mem.id);
                        setEditWhat(mem.what);
                        setEditValue(mem.value);
                      }}
                    >
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => deleteMemory(mem.id)}
                    >
                      <Text style={styles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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
    backgroundColor: '#fafafa',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
    minHeight: 60,
  },
  button: {
    backgroundColor: '#000',
    padding: 14,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  responseContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 16,
    marginBottom: 24,
  },
  response: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  memoriesSection: {
    flex: 1,
  },
  memoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memoriesCount: {
    fontSize: 13,
    color: '#999',
    textTransform: 'lowercase',
  },
  backupButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  backupButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backupButtonText: {
    fontSize: 12,
    color: '#666',
  },
  memoriesList: {
    flex: 1,
  },
  memoryItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 14,
    marginBottom: 8,
  },
  memoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  memoryTextContainer: {
    flex: 1,
  },
  memoryText: {
    fontSize: 15,
    lineHeight: 22,
  },
  memoryTimestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  memoryWhat: {
    color: '#666',
  },
  memorySeparator: {
    color: '#ccc',
  },
  memoryValue: {
    color: '#000',
  },
  memoryActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionButtonText: {
    fontSize: 13,
    color: '#666',
  },
  editContainer: {
    gap: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 8,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  editSeparator: {
    fontSize: 15,
    color: '#ccc',
    textAlign: 'center',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  editSaveButton: {
    flex: 1,
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  editCancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    color: '#fff',
  },
  editCancelButtonText: {
    fontSize: 14,
    color: '#000',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: '#999',
    marginBottom: 8,
  },
  emptyStateHint: {
    fontSize: 13,
    color: '#ccc',
    textAlign: 'center',
  },
});
