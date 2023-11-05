import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import { INestApplication } from '@nestjs/common';

describe('EventsController (e2e)', () => {
    let app: INestApplication;
    let eventId;
    let userId = 1;
    // Same setup as before
    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    // Create a new task:
    it('POST /events', () => {
        return request(app.getHttpServer())
            .post('/events')
            .send({
                title: 'Test Event 0',
                description: 'Attend the meeting',
                startTime: '2023-11-15T14:00:00.000Z',
                endTime: '2023-11-15T15:00:00.000Z',
                invitees: [1, 2],
            })
            .expect(201)
            .then((response) => {
                expect(response.body).toHaveProperty('id');
                eventId = response.body.id; // Save the id for later use
            });
    });

    it('POST /events', () => {
        return request(app.getHttpServer())
            .post('/events')
            .send({
                title: 'Test Event 1',
                description: 'Attend the meeting',
                startTime: '2023-11-10T14:00:00.000Z',
                endTime: '2023-11-10T15:00:00.000Z',
                invitees: [1, 2],
            })
            .expect(201)
            .then((response) => {
                expect(response.body).toHaveProperty('id');
            });
    });

    it('POST /events', () => {
        return request(app.getHttpServer())
            .post('/events')
            .send({
                title: 'Test Event 2',
                description: 'Attend the meeting',
                startTime: '2023-11-10T15:00:00.000Z',
                endTime: '2023-11-10T18:00:00.000Z',
                invitees: [1, 2],
            })
            .expect(201)
            .then((response) => {
                expect(response.body).toHaveProperty('id');
            });
    });


    // Retrieve a task by its id
    it('GET /events/:id', () => {
        //const eventId = 1;
        return request(app.getHttpServer())
            .get(`/events/${eventId}`)
            .expect(200)
            .then((response) => {
                expect(response.body).toHaveProperty('id', eventId);
            });
    });
    // Delete a task by its id
    it('DELETE /events/delete/:id', async () => {
        //const eventId = 1; // Replace with a valid event id that can be deleted
        await request(app.getHttpServer())
            .delete(`/events/delete/${eventId}`)
            .expect(200);

        await request(app.getHttpServer())
            .get(`/events/${eventId}`)
            .expect(404);
    });

    // MergeAll
    it('POST /events/mergeAll/:userId', async () => {

        let initialEventCount;
        let newEventCount;
        let mergedEventsResponse;

        // Get the count of current events for the user
        await request(app.getHttpServer())
            .get(`/users/eventCount/${userId}`)
            .expect(200)
            .then((response) => {
                initialEventCount = response.body.eventCount;
            });

        // Send the merge request
        await request(app.getHttpServer())
            .post(`/events/mergeAll/${userId}`)
            .expect(201) // Expecting the creation status code
            .then((response) => {
                // Capture the array of merged events from the response
                mergedEventsResponse = response.body;
                expect(Array.isArray(mergedEventsResponse)).toBeTruthy();
                expect(mergedEventsResponse.length).toBeGreaterThan(0); // Assuming that at least one merged event is returned
                mergedEventsResponse.forEach(event => {
                    expect(event).toHaveProperty('id'); // Each merged event should have an id
                });
            });

        // check the count of events for the user again and confirm the merged event is in the list
        await request(app.getHttpServer())
            .get(`/users/eventCount/${userId}`)
            .expect(200)
            .then((response) => {
                newEventCount = response.body.eventCount;
                // Check the number of events has reduced
                expect(newEventCount).toBeLessThan(initialEventCount);
            });
    });

});
