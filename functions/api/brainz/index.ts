type Brain = {
    id: string,
    age: number,
    movements: number,
    travelled: number,
    brain: {
        hash: number,
        levels: any[]
    },
    height: number,
    width: number,
    fitness: number,
    kills: number,
    score: number
}

export const onRequestGet: PagesFunction<{ BRAINZ: KVNamespace }> = async ({ env }) => {

    try {

        console.log("GET BRAINZ");

        const brainz = await env.BRAINZ.get('TOP_30');

        if (!brainz) {
            await env.BRAINZ.put('TOP_30', JSON.stringify([]));
        }

        return new Response(brainz || '[]', {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });
    }
    catch (e) {
        return new Response(JSON.stringify({ error: e }), { status: 500 });
    }
}

export const onRequestPost: PagesFunction<{ BRAINZ: KVNamespace }> = async ({ request, params, env }) => {

    console.log("SAVE BRAIN");
    let payload : Brain = await request.json();
    const table = await env.BRAINZ.get('TOP_30');

    if (table) {
        const brainz : Brain[] = JSON.parse(table);
        if (brainz.filter(x => x.brain.hash == payload.brain.hash).length == 0) {
            console.log("New Brain");
            await env.BRAINZ.put('TOP_30', JSON.stringify([...brainz, payload].sort((a, b) => b.score - a.score).slice(0, 30)));
        }
    }
    else {
        await env.BRAINZ.put('TOP_30', JSON.stringify([payload]));
    }

    return new Response();
}
