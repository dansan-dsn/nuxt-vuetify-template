<script setup lang="ts">
const counter = useState("counter", () => 0);
</script>

<template>
  <h1>Welcome to home page</h1>
  <div>
    <v-btn @click="counter++">Increment</v-btn>
    <span class="mx-2">{{ counter }}</span>
    <v-btn @click="counter--">Decrement</v-btn>
  </div>
</template>
