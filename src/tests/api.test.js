import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { api } from "../services/api";
import { MOCK_VENUES, MOCK_TEAMS } from "./mockData";

// Use wildcard or match both localhost and 127.0.0.1
const server = setupServer(
    http.get("*/api/venues", () => {
        return HttpResponse.json(MOCK_VENUES);
    }),

    http.get("*/api/teams", () => {
        return HttpResponse.json(MOCK_TEAMS);
    }),

    http.post("*/api/teams", async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({ id: 99, ...body }, { status: 201 });
    }),

    http.delete("*/api/teams/99", () => {
        return new HttpResponse(null, { status: 204 });
    }),

    http.get("*/api/users", () => {
        return HttpResponse.json([{ id: 1, username: "admin", roles: ["ADMIN"] }]);
    }),

    http.post("*/api/users", async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({ id: 2, ...body }, { status: 201 });
    }),

    http.patch("*/api/users/2", async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({ id: 2, username: "updated", ...body });
    }),

    http.delete("*/api/users/2", () => {
        return new HttpResponse(null, { status: 204 });
    }),

    http.get("*/api/catering-requests", () => {
        return HttpResponse.json([{ id: 1, booking: 10, status: "PENDING" }]);
    }),

    http.patch("*/api/catering-requests/1", async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({ id: 1, ...body });
    })
);

beforeAll(() => server.listen());
afterEach(() => {
    server.resetHandlers();
    localStorage.clear();
});
afterAll(() => server.close());

describe("API Service Layer Tests", () => {
    it("fetches venues successfully", async () => {
        const venues = await api.getVenues();
        expect(venues).toEqual(MOCK_VENUES);
    });

    it("fetches teams successfully", async () => {
        const teams = await api.getTeams();
        expect(teams).toEqual(MOCK_TEAMS);
    });

    it("creates a team successfully via POST request", async () => {
        const newTeamData = { name: "3rd XI", is_external: false };
        const result = await api.createTeam(newTeamData);

        expect(result.id).toBe(99);
        expect(result.name).toBe("3rd XI");
    });

    it("fetches, creates, updates and deletes users successfully", async () => {
        const users = await api.getUsers();
        expect(users).toEqual([{ id: 1, username: "admin", roles: ["ADMIN"] }]);

        const created = await api.createUser({ username: "john", email: "john@example.com" });
        expect(created.id).toBe(2);
        expect(created.username).toBe("john");

        const updated = await api.updateUser(2, { is_locked: true });
        expect(updated.is_locked).toBe(true);

        const deleted = await api.deleteUser(2);
        expect(deleted).toBeNull();
    });

    it("fetches and updates catering requests successfully", async () => {
        const requests = await api.getCateringRequests();
        expect(requests).toEqual([{ id: 1, booking: 10, status: "PENDING" }]);

        const updated = await api.updateCateringRequest(1, { status: "APPROVED" });
        expect(updated.status).toBe("APPROVED");
    });
});