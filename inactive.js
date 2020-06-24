Array.range = function (n) {
    // Array.range(5) --> [0,1,2,3,4]
    return Array.apply(null, Array(n)).map((x, i) => i)
};

Object.defineProperty(Array.prototype, 'chunk', {
    value: function (n) {

        // ACTUAL CODE FOR CHUNKING ARRAY:
        return Array.range(Math.ceil(this.length / n)).map((x, i) => this.slice(i * n, i * n + n));

    }
});

const jsonfile = require('jsonfile')
const fetch = require('node-fetch');
const conceptos = require('./frecuentes-andes.json');

const firstChunk = (conceptos.chunk(1000)[0]);

async function main() {
    let chunkNumber = 0;
    const inactive = []

    const chunks = conceptos.chunk(1000);
    console.log('Total chunks:', chunks.length);
    for (const conceptos of chunks) {
        const concepts = await getConcept(conceptos);
        concepts.filter(c => !c.active).forEach(c => {
            const conceptFind = conceptos.find(cc => cc.conceptId === c.conceptId);
            inactive.push({
                ...conceptFind
            })
        });
        console.log(++chunkNumber);

    }
    // console.log(JSON.stringify(inactive));
    jsonfile.writeFileSync('conceptos-inactivos.json', inactive, { spaces: 4 })
}

main();

async function getConcept(conceptos) {
    const ids = conceptos.map(c => c.conceptId);
    return await fetch('http://172.16.80.80:8080/browser/MAIN/ODONTO/NEUQUEN/concepts/bulk-load', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conceptIds: ids })
    }).then(res => res.json());

}

/**
 * db.getCollection('profesionalMeta').aggregate([
    { $unwind: '$frecuentes' },
    { $group: { _id: '$frecuentes.concepto.conceptId',  concepto: { $first: '$frecuentes.concepto'    } }  },
    { $replaceRoot : { newRoot: '$concepto' }  },
    { $project: { refsetIds: 0 } }
    ]).toArray()
 */