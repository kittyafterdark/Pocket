import type { PhoneState } from '../types.js';
import { datingFor } from './lumistry.js';
import { snapshotActivityClock } from './activity-clock.js';
import { verifiedDatingEncounter } from './lumistry-development-contract.js';
import { settledMessage } from './lumistry-experience-tools.js';
/** Evidence and message history, never a relationship ladder or a feeling score. */
export function connectionHistory(state: PhoneState, owner: string, id: string) {
    const d = datingFor(state, owner), x = d.decisions.find(x => x.conversationId === id), p = d.profiles.find(p => p.id === x?.profileId), c = state.conversations.find(c => c.id === id && c.channel === 'dating' && c.datingOwnerId === owner);
    if (!x || !p || !c)
        return;
    const recent = c.messages.filter(m=>settledMessage(m,state)).slice(-8), own = recent.filter(m => (m.senderActorId || (m.sender === 'persona' ? owner : '')) === owner).length, theirs = recent.filter(m => (m.senderActorId || m.senderContactId) === p.contactId).length;
    const dates = d.relationships.events.filter(e => !e.needsReview && e.profileId === p.id && e.conversationId === id && e.kind === 'date');
    const encountered = verifiedDatingEncounter(state, p).length > 0;
    const completed = dates.filter(e => e.status === 'completed' && e.timelineId && state.events?.some(t => t.id === e.timelineId && t.completed && t.source?.conversationId === id && t.participantActorIds?.includes(owner) && t.participantActorIds?.includes(p.contactId)));
    const clock = snapshotActivityClock(state), elapsed = x.matchedStoryAt && clock.storyAt ? Date.parse(clock.storyAt) - Date.parse(x.matchedStoryAt) : NaN;
    return { rhythm: own && theirs ? `Recent exchange: ${own} texts from you, ${theirs} from them.` : recent.length ? 'One side has sent the recent messages. This does not establish interest or rejection.' : 'No committed exchange yet.', pause: c.pause, matchedStoryAt: x.matchedStoryAt, matchedStoryLabel: x.matchedStoryLabel, daysSinceMatch: Number.isFinite(elapsed) && elapsed >= 86400000 ? Math.floor(elapsed / 86400000) : undefined, exchanged: x.exchanged, completed: encountered ? completed : [], canReflect: encountered && completed.length > 0 };
}
