<script setup>
import VoteCard from '../components/group/VoteCard.vue'
import CommentBox from '../components/group/CommentBox.vue'
import MeetingTicket from '../components/group/MeetingTicket.vue'

const voteOptions = [
  {
    id: 1,
    title: 'Myeongdong + Namdaemun',
    description: 'Shopping-focused route with easy transit access.',
    tally: '58%',
    note: '12 votes',
  },
  {
    id: 2,
    title: 'Gwanghwamun + Insadong',
    description: 'Historic spots with cultural walking routes.',
    tally: '42%',
    note: '9 votes',
  },
]

const comments = [
  {
    id: 1,
    name: 'Sora',
    time: '2h ago',
    text: 'This route looks best for the first meeting point.',
  },
  {
    id: 2,
    name: 'Jun',
    time: '1h ago',
    text: 'The station access is better on the first option.',
  },
]
</script>

<template>
  <main class="group-page">
    <section class="group-page__hero">
      <div class="group-page__hero-copy">
        <p class="group-page__eyebrow">Group page</p>
        <h1 class="group-page__title">Choose the meeting route for the trip group</h1>
        <p class="group-page__description">
          This page is a static migration slice. Voting, sharing, and comments remain visual only.
        </p>

        <div class="group-page__actions">
          <button class="group-page__button group-page__button--primary" type="button">
            Share
          </button>
          <button class="group-page__button" type="button">Copy invite</button>
        </div>
      </div>

      <MeetingTicket
        title="Meeting ticket"
        date="2026.07.14"
        time="18:30"
        place="Seoul City Hall Station"
        note="Static placeholder ticket for the group layout."
      />
    </section>

    <section class="group-page__content">
      <div class="group-page__voting">
        <div class="group-page__section-heading">
          <h2>Vote cards</h2>
          <p>Buttons are present but do not trigger any logic yet.</p>
        </div>

        <div class="group-page__vote-list">
          <VoteCard v-for="option in voteOptions" :key="option.id" :option="option" />
        </div>
      </div>

      <aside class="group-page__sidebar">
        <CommentBox :comments="comments" />
      </aside>
    </section>
  </main>
</template>

<style scoped>
.group-page {
  width: 100%;
  max-width: 1126px;
  margin: 0 auto;
  padding: 32px;
  box-sizing: border-box;
}

.group-page__hero {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.6fr);
  gap: 24px;
  align-items: stretch;
  padding: 32px;
  border: 1px solid var(--border);
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgba(170, 59, 255, 0.1), transparent 28%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.92));
  box-shadow: var(--shadow);
}

.group-page__hero-copy {
  display: grid;
  gap: 16px;
  align-content: center;
}

.group-page__eyebrow {
  margin: 0;
  color: var(--accent);
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.group-page__title {
  margin: 0;
  color: var(--text-h);
  font-size: clamp(2rem, 3.8vw, 3.6rem);
  line-height: 1.05;
  letter-spacing: -0.04em;
  max-width: 13ch;
}

.group-page__description {
  margin: 0;
  max-width: 60ch;
  color: var(--text);
  font-size: 1rem;
  line-height: 1.7;
}

.group-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 6px;
}

.group-page__button {
  min-height: 48px;
  padding: 0 18px;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.95);
  color: var(--text-h);
  font: inherit;
  font-weight: 700;
  cursor: default;
}

.group-page__button--primary {
  border-color: var(--accent-border);
  background: var(--accent);
  color: #fff;
}

.group-page__content {
  margin-top: 28px;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
  gap: 20px;
}

.group-page__voting,
.group-page__sidebar {
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
}

.group-page__section-heading {
  display: grid;
  gap: 8px;
  margin-bottom: 18px;
}

.group-page__section-heading h2 {
  margin: 0;
  color: var(--text-h);
  font-size: 1.35rem;
}

.group-page__section-heading p {
  margin: 0;
  color: var(--text);
}

.group-page__vote-list {
  display: grid;
  gap: 16px;
}

@media (max-width: 1024px) {
  .group-page {
    padding: 20px;
  }

  .group-page__hero,
  .group-page__content {
    grid-template-columns: 1fr;
  }

  .group-page__hero {
    padding: 24px;
  }
}

@media (max-width: 640px) {
  .group-page {
    padding: 16px;
  }

  .group-page__hero {
    padding: 20px;
    border-radius: 22px;
  }

  .group-page__voting,
  .group-page__sidebar {
    padding: 20px;
  }
}
</style>