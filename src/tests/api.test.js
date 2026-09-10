import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { api } from "../services/api";
import { MOCK_VENUES, MOCK_TEAMS } from "../services/mockData";

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
});