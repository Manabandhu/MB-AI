import assert from 'node:assert/strict';
import test from 'node:test';
import {
  contactsFromParticipants,
  conversationTitle,
  conversationTypeLabel,
  isHttpUrl,
  participantLabel,
  roleLabel,
} from '../src/modules/chat/chatFormat.ts';

test('labels never invent names and compare types case-insensitively', () => {
  assert.equal(participantLabel({ userId: 'abcd1234' }, 'abcd1234'), 'You');
  assert.equal(participantLabel({ userId: 'abcd1234' }, 'zzz'), 'Member ABCD');
  assert.equal(participantLabel({ userId: 'abcd1234', name: ' Asha ' }, 'zzz'), 'Asha');
  assert.equal(conversationTypeLabel('group'), 'Group chat');
  assert.equal(conversationTypeLabel('DIRECT'), 'Direct message');
  assert.equal(conversationTitle({ id: '1', type: 'GROUP' }), 'Group chat');
  assert.equal(conversationTitle({ id: '1', type: 'GROUP', title: 'Flat 4B' }), 'Flat 4B');
  assert.equal(roleLabel('owner'), 'Owner');
  assert.equal(roleLabel('MEMBER'), 'Member');
});

test('isHttpUrl accepts only absolute web URLs', () => {
  assert.ok(isHttpUrl('https://example.com/a.jpg'));
  assert.ok(!isHttpUrl('file:///var/mobile/a.jpg'));
  assert.ok(!isHttpUrl('hello'));
});

test('contactsFromParticipants dedupes people and skips the caller', () => {
  const contacts = contactsFromParticipants(
    [
      {
        conversation: { id: 'c1', type: 'DIRECT' },
        participants: [{ userId: 'me' }, { userId: 'u1' }],
      },
      {
        conversation: { id: 'c2', type: 'GROUP', title: 'Trip' },
        participants: [{ userId: 'me' }, { userId: 'u1' }, { userId: 'u2' }],
      },
    ],
    'me',
  );
  assert.deepEqual(
    contacts.map((c) => [c.userId, c.sharedIn.map((s) => s.id)]),
    [
      ['u1', ['c1', 'c2']],
      ['u2', ['c2']],
    ],
  );
  assert.equal(contacts[0].sharedIn[0].type, 'DIRECT');
});

test('withoutDeliveredPending drops only the first matching own pending message', async () => {
  const { withoutDeliveredPending } = await import('../src/modules/chat/chatFormat.ts');
  const pending = [
    { tempId: 't1', body: 'hi' },
    { tempId: 't2', body: 'hi' },
    { tempId: 't3', body: 'other' },
  ];
  assert.deepEqual(
    withoutDeliveredPending(pending, { senderId: 'me', body: 'hi ' }, 'me').map((p) => p.tempId),
    ['t2', 't3'],
  );
  assert.equal(withoutDeliveredPending(pending, { senderId: 'you', body: 'hi' }, 'me').length, 3);
  assert.equal(withoutDeliveredPending(pending, { senderId: 'me', body: 'nope' }, 'me').length, 3);
});
