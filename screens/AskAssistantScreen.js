import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// -------------- 🔥 ADD YOUR OPENAI API KEY HERE -----------------
const OPENAI_API_KEY = "";
// ---------------------------------------------------------------

export default function AskAssistantScreen() {
  const [messages, setMessages] = useState([
    { id: '1', sender: 'bot', text: 'Hi! I’m your assistant. Ask me anything about budgets, savings, your expenses, or how to use Raseed!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  /* ⭐ PRE-GENERATED CLICKABLE PROMPTS */
  const quickPrompts = [
    "How do I scan a receipt?",
    "Why is my spending high this month?",
    "Give me a budget plan.",
    "How do I add an expense?",
    "Explain the Insights screen.",
    "How can I increase my savings?",
  ];

  const handleQuickPrompt = async (prompt) => {
    setInput(prompt);
    setTimeout(() => sendMessage(prompt), 100);
  };

  const sendMessage = async (forcedText) => {
    const finalText = forcedText || input.trim();
    if (!finalText) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: finalText,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content: `
You are **Raseed AI**, the official financial assistant inside the Raseed personal finance app.

Your job:
• Answer ALL questions about how to use the Raseed app:
  – Adding expenses or income  
  – Scanning receipts  
  – Viewing insights  
  – Budgets, savings goals  
  – Syncing, categories, data export  
  – Troubleshooting app features

• Provide **smart, profile-based financial advice**  
• Speak in friendly, simple language  
• Never mention you are an AI model  
              `
            },
            { role: "user", content: finalText }
          ]
        })
      });

      const data = await response.json();
      const botReply =
        data?.choices?.[0]?.message?.content ||
        "I’m sorry, I couldn’t understand that.";

      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botReply,
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.log("OPENAI ERROR:", error);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          sender: "bot",
          text: "Something went wrong. Try again later."
        }
      ]);
    }

    setLoading(false);
  };

  /* ⭐ CUSTOM RENDER: Inserts prompt box directly after first message */
  const renderItem = ({ item, index }) => (
    <>
      <View
        style={[
          styles.messageBubble,
          item.sender === "user" ? styles.userBubble : styles.botBubble,
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
      </View>

      {/* ⭐ Insert Quick Prompts RIGHT BELOW FIRST BOT MESSAGE */}
      {index === 0 && (
        <View style={styles.quickPromptContainer}>
          {quickPrompts.map((prompt, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.quickPromptButton}
              onPress={() => handleQuickPrompt(prompt)}
            >
              <Text style={styles.quickPromptText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.heading}>Ask Assistant</Text>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.chatContainer}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity onPress={() => sendMessage()} disabled={loading}>
          <Ionicons name="send" size={24} color="#1c2b48" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f6f8fa",
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1c2b48",
    marginTop: 14,
    marginBottom: 14,
  },

  /* ⭐ PROMPT STYLING */
  quickPromptContainer: {
    backgroundColor: "#ffffff",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
    marginTop: -4,
  },
  quickPromptButton: {
    backgroundColor: "#e8f0ff",
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
  },
  quickPromptText: {
    fontSize: 14,
    color: "#1c2b48",
    fontWeight: "600",
  },

  chatContainer: {
    flexGrow: 1,
    paddingVertical: 10,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    marginVertical: 6,
    maxWidth: "75%",
  },
  userBubble: {
    backgroundColor: "#d1e3ff",
    alignSelf: "flex-end",
  },
  botBubble: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    borderColor: "#e2e8f0",
    borderWidth: 1,
  },
  messageText: {
    fontSize: 15,
    color: "#1c2b48",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#cbd5e1",
    paddingTop: 10,
    marginTop: 10,
    marginBottom: 50,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#f9fafb",
    marginRight: 10,
    fontSize: 15,
  },
});