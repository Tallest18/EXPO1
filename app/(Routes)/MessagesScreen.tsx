// src/screens/MessagesScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const MessagesScreen = () => {
  const [messages, setMessages] = useState<{ id: string; text: string }[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (input.trim() === "") return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), text: input.trim() },
    ]);
    setInput("");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View
        style={{ flex: 1, backgroundColor: "#fff", padding: 10, marginTop: 30 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 10,
          }}
        >
          <Ionicons name="chatbubbles-outline" size={24} color="#333" />
          <Text
            style={{
              fontSize: 18,
              fontFamily: "DMSans_700Bold",
              marginLeft: 10,
            }}
          >
            Messages
          </Text>
        </View>

        {/* Messages List */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={{
                padding: 10,
                backgroundColor: "#f1f1f1",
                borderRadius: 8,
                marginBottom: 8,
                alignSelf: "flex-start",
              }}
            >
              <Text>{item.text}</Text>
            </View>
          )}
          contentContainerStyle={{ flexGrow: 1 }}
        />

        {/* Input Box */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 8,
            borderTopWidth: 1,
            borderColor: "#ddd",
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 20,
              paddingHorizontal: 15,
              paddingVertical: 8,
              marginRight: 8,
              fontFamily: "DMSans_400Regular",
            }}
          />
          <TouchableOpacity onPress={sendMessage}>
            <Ionicons name="send" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default MessagesScreen;
