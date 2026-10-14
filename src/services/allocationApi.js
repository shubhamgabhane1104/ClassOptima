
export async function runAutoAllocation() {
    const res = await fetch(
        'http://localhost:5000/api/v1/allocation/generate',
        {
            method: 'POST'
        }
    );

    return res.json();
}
