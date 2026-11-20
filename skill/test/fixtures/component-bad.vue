<template>
  <div class="card">
    <h2>Trade now!</h2>
    <p>{{ price }} USD per contract</p>
  </div>
</template>

<script setup>
const price = 10;
</script>

<style scoped>
.card { background: #1E1E1E; border-radius: 16px; font-family: Roboto, sans-serif; }
</style>
