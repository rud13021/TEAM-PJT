<template>
  <section class="comment-box">
    <div class="comment-box__header">
      <div>
        <p class="comment-box__eyebrow">Comments</p>
        <h3 class="comment-box__title">Meeting discussion</h3>
      </div>

      <button class="comment-box__button" type="button">Add comment</button>
    </div>

    <div class="comment-box__composer">
      <input class="comment-box__input" type="text" placeholder="Write a placeholder comment" />
      <button class="comment-box__send" type="button">Send</button>
    </div>

    <div class="comment-box__list">
      <article v-for="comment in comments" :key="comment.id" class="comment-box__item">
        <div class="comment-box__item-head">
          <strong>{{ comment.name }}</strong>
          <span>{{ comment.time }}</span>
        </div>
        <p>{{ comment.text }}</p>
      </article>
    </div>
  </section>
</template>

<script setup>
defineProps({
  comments: {
    type: Array,
    default: () => [],
  },
})
</script>

<style scoped>
.comment-box {
  display: grid;
  gap: 16px;
}

.comment-box__header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
}

.comment-box__eyebrow {
  margin: 0 0 8px;
  color: var(--accent);
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.comment-box__title {
  margin: 0;
  color: var(--text-h);
  font-size: 1.18rem;
}

.comment-box__button,
.comment-box__send {
  min-height: 42px;
  padding: 0 16px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.95);
  color: var(--text-h);
  font: inherit;
  font-weight: 700;
  cursor: default;
}

.comment-box__composer {
  display: grid;
  gap: 10px;
}

.comment-box__input {
  width: 100%;
  min-height: 50px;
  padding: 0 16px;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.96);
  color: var(--text-h);
  font: inherit;
  box-sizing: border-box;
}

.comment-box__list {
  display: grid;
  gap: 12px;
}

.comment-box__item {
  padding: 16px;
  border-radius: 18px;
  border: 1px solid var(--border);
  background: var(--code-bg);
}

.comment-box__item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.comment-box__item-head strong {
  color: var(--text-h);
}

.comment-box__item-head span,
.comment-box__item p {
  color: var(--text);
}

.comment-box__item p {
  margin: 0;
  line-height: 1.6;
}

@media (max-width: 640px) {
  .comment-box__header {
    flex-direction: column;
  }
}
</style>