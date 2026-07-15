<template>
  <article class="meeting-ticket">
    <p class="meeting-ticket__eyebrow">{{ title }}</p>

    <div class="meeting-ticket__body">
      <div>
        <span class="meeting-ticket__label">Date</span>
        <strong class="meeting-ticket__value">{{ date }}</strong>
      </div>
      <div>
        <span class="meeting-ticket__label">Time</span>
        <strong class="meeting-ticket__value">{{ time }}</strong>
      </div>
      <div>
        <span class="meeting-ticket__label">Place</span>
        <strong class="meeting-ticket__value">{{ place }}</strong>
      </div>
    </div>

    <p class="meeting-ticket__note">{{ note }}</p>
  </article>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  place: {
    type: String,
    required: true,
  },
  note: {
    type: String,
    required: true,
  },
})
</script>

<style scoped>
.meeting-ticket {
  padding: 24px;
  border-radius: 24px;
  border: 1px solid var(--accent-border);
  background:
    radial-gradient(circle at top left, rgba(170, 59, 255, 0.14), transparent 30%),
    var(--accent-bg);
  display: grid;
  gap: 16px;
  align-content: start;
}

.meeting-ticket__eyebrow {
  margin: 0;
  color: var(--accent);
  font-size: 0.86rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.meeting-ticket__body {
  display: grid;
  gap: 14px;
}

.meeting-ticket__label {
  display: block;
  margin-bottom: 4px;
  color: var(--text);
  font-size: 0.88rem;
}

.meeting-ticket__value {
  color: var(--text-h);
  font-size: 1.05rem;
}

.meeting-ticket__note {
  margin: 0;
  color: var(--text);
  font-size: 0.92rem;
  line-height: 1.6;
}
</style>