<script setup>
import { ref } from 'vue'

const props = defineProps({
  count: { type: Number, default: 5 }
})

const countValue = ref(props.count)

function increment() {
  countValue.value++
}

function decrement() {
  countValue.value--
}
</script>

<template>
  <button id="decr" @click="decrement">--</button>
  <span>{{ countValue }}</span>
  <button id="incr" @click="increment">++</button>
</template>
