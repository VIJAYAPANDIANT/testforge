import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { io as Client } from 'socket.io-client';
import app from '../src/app.js';
import { initSocketServer, emitRunEvent, SOCKET_EVENTS } from '../src/socket/index.js';

describe('Day 19 — Socket.IO Server & Real-Time Event Integration', () => {
  let server;
  let port;
  let clientSocket;

  before((context, done) => {
    server = http.createServer(app);
    initSocketServer(server);

    server.listen(0, () => {
      port = server.address().port;
      clientSocket = Client(`http://localhost:${port}`, {
        transports: ['websocket'],
        forceNew: true,
      });

      clientSocket.on('connect', () => {
        done();
      });
    });
  });

  after(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    if (server) {
      server.close();
    }
  });

  test('A. Socket server starts and client connects successfully', () => {
    assert.equal(clientSocket.connected, true);
    assert.ok(typeof clientSocket.id === 'string');
  });

  test('B. Client joins run room and receives scoped RUN_QUEUED event', (context, done) => {
    const runId = '66f1234567890abcdef11111';

    clientSocket.emit(SOCKET_EVENTS.JOIN_RUN, { runId });

    clientSocket.once(SOCKET_EVENTS.RUN_QUEUED, (data) => {
      assert.equal(data.runId, runId);
      assert.equal(data.status, 'queued');
      done();
    });

    // Small delay to ensure room join completes before emitting
    setTimeout(() => {
      emitRunEvent(runId, SOCKET_EVENTS.RUN_QUEUED, { runId, status: 'queued' });
    }, 50);
  });

  test('C. Client receives RUN_STARTED event', (context, done) => {
    const runId = '66f1234567890abcdef11111';
    const startedAt = new Date().toISOString();

    clientSocket.once(SOCKET_EVENTS.RUN_STARTED, (data) => {
      assert.equal(data.runId, runId);
      assert.equal(data.status, 'running');
      assert.equal(data.startedAt, startedAt);
      done();
    });

    emitRunEvent(runId, SOCKET_EVENTS.RUN_STARTED, { runId, status: 'running', startedAt });
  });

  test('D. Client receives STEP_STARTED, STEP_PASSED, and STEP_FAILED events', (context, done) => {
    const runId = '66f1234567890abcdef11111';
    const receivedEvents = [];

    const handleStepEvent = (event, data) => {
      receivedEvents.push({ event, data });
      if (receivedEvents.length === 3) {
        assert.equal(receivedEvents[0].event, SOCKET_EVENTS.STEP_STARTED);
        assert.equal(receivedEvents[0].data.stepIndex, 0);
        assert.equal(receivedEvents[0].data.stepType, 'navigate');

        assert.equal(receivedEvents[1].event, SOCKET_EVENTS.STEP_PASSED);
        assert.equal(receivedEvents[1].data.stepIndex, 0);

        assert.equal(receivedEvents[2].event, SOCKET_EVENTS.STEP_FAILED);
        assert.equal(receivedEvents[2].data.stepIndex, 1);
        assert.equal(receivedEvents[2].data.error, 'Locator not found');

        clientSocket.off(SOCKET_EVENTS.STEP_STARTED);
        clientSocket.off(SOCKET_EVENTS.STEP_PASSED);
        clientSocket.off(SOCKET_EVENTS.STEP_FAILED);
        done();
      }
    };

    clientSocket.on(SOCKET_EVENTS.STEP_STARTED, (d) => handleStepEvent(SOCKET_EVENTS.STEP_STARTED, d));
    clientSocket.on(SOCKET_EVENTS.STEP_PASSED, (d) => handleStepEvent(SOCKET_EVENTS.STEP_PASSED, d));
    clientSocket.on(SOCKET_EVENTS.STEP_FAILED, (d) => handleStepEvent(SOCKET_EVENTS.STEP_FAILED, d));

    emitRunEvent(runId, SOCKET_EVENTS.STEP_STARTED, { runId, stepIndex: 0, stepType: 'navigate', status: 'running' });
    emitRunEvent(runId, SOCKET_EVENTS.STEP_PASSED, { runId, stepIndex: 0, stepType: 'navigate', status: 'passed' });
    emitRunEvent(runId, SOCKET_EVENTS.STEP_FAILED, { runId, stepIndex: 1, stepType: 'click', status: 'failed', error: 'Locator not found' });
  });

  test('E. Client receives RUN_COMPLETED event', (context, done) => {
    const runId = '66f1234567890abcdef11111';

    clientSocket.once(SOCKET_EVENTS.RUN_COMPLETED, (data) => {
      assert.equal(data.runId, runId);
      assert.equal(data.status, 'passed');
      assert.equal(data.durationMs, 1250);
      done();
    });

    emitRunEvent(runId, SOCKET_EVENTS.RUN_COMPLETED, { runId, status: 'passed', durationMs: 1250 });
  });

  test('F. Events from another run room are isolated and not received', (context, done) => {
    const runIdA = '66f1234567890abcdef11111';
    const runIdB = '99f9999999999ffffff99999';

    let receivedOtherRunEvent = false;

    const handler = (data) => {
      if (data.runId === runIdB) {
        receivedOtherRunEvent = true;
      }
    };

    clientSocket.on(SOCKET_EVENTS.RUN_STARTED, handler);

    // Emit event to runIdB (client only joined runIdA)
    emitRunEvent(runIdB, SOCKET_EVENTS.RUN_STARTED, { runId: runIdB, status: 'running' });

    setTimeout(() => {
      clientSocket.off(SOCKET_EVENTS.RUN_STARTED, handler);
      assert.equal(receivedOtherRunEvent, false, 'Client should not receive events for unjoined room runIdB');
      done();
    }, 150);
  });
});
