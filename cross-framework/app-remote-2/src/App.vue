<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps({
  hostProps: {
    type: Object,
    default: () => ({}),
  },
});

const count = ref(0);
const messages = ref([]);
let subscription = null;

onMounted(() => {
  const eventBus = props.hostProps?.eventBus;
  if (eventBus) {
    subscription = eventBus.on("global:message", (payload) => {
      messages.value.push(`[${payload.from}]: ${payload.text}`);
    });
  }
});

onUnmounted(() => {
  subscription?.unsubscribe();
});

function increment() {
  count.value++;
}

function sendMessage() {
  const eventBus = props.hostProps?.eventBus;
  eventBus?.emit("global:message", {
    from: "Vue MFE",
    text: `Hello from Vue! Count is ${count.value}`,
  });
}
</script>

<template>
  <div class="mfe-container">
    <h2>🟢 Vue Micro Frontend</h2>

    <div v-if="hostProps?.auth?.isAuthenticated" class="auth-info">
      Logged in as: <strong>{{ hostProps.auth.user?.username }}</strong>
    </div>

    <div class="card">
      <button @click="increment">count is {{ count }}</button>
      <button class="btn-send" @click="sendMessage">Send Message to Other MFEs</button>
    </div>

    <div v-if="messages.length > 0" class="messages">
      <h4>Messages from other MFEs:</h4>
      <div v-for="(msg, i) in messages" :key="i" class="message">{{ msg }}</div>
    </div>
  </div>
</template>

<style scoped>
.mfe-container {
  padding: 1.5rem;
  border: 2px solid #42b883;
  border-radius: 8px;
  font-family: sans-serif;
}
h2 {
  color: #42b883;
  margin-top: 0;
}
.auth-info {
  padding: 0.5rem;
  background: #e8f5e9;
  border-radius: 4px;
  margin-bottom: 1rem;
}
.card {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
}
.card button {
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  background: white;
}
.btn-send {
  background: #42b883 !important;
  color: white;
  border-color: #42b883 !important;
}
.messages {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 4px;
}
.messages h4 {
  margin: 0 0 0.5rem 0;
}
.message {
  padding: 0.25rem 0;
  font-size: 0.9rem;
  border-bottom: 1px solid #eee;
}
</style>
