<template>
  <div class="card">
    <h2>Daily expiry at 20:00 ET</h2>
    <p>{{ price }} USDC per contract</p>
  </div>
</template>

<script setup>
const price = 10;
</script>

<style scoped>
.card { background: var(--strike-surface-1); border-radius: 12px; font-family: Geist, Arial, sans-serif; }
</style>
