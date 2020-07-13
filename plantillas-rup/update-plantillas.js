const fetch = require('node-fetch');
const { MongoClient, ObjectId } = require('mongodb');

async function main() {

    const conn = await MongoClient.connect('mongodb://localhost:27017/andes');
    const db = conn.db('andes');
    const PlantillasRUP = db.collection('plantillasRUP');

    const documents = PlantillasRUP.find();

    for await (const doc of documents) {

        const { items } = await getByExpression(doc.expression);
        const conceptos = items.map(item => {
            return {
                conceptId: item.conceptId,
                fsn: item.fsn.term,
                term: item.pt.term,
                semanticTag: getSemanticTagFromFsn(item.fsn.term)
            }
        })

        doc.conceptos = conceptos;

        const id = doc._id;
        delete doc._id;
        await PlantillasRUP.update({ _id: id }, doc);

    }
    console.log('DONE');
    process.exit();
}

const cacheConceptos = {};
async function getConcept(id) {
    if (cacheConceptos[id]) {
        return cacheConceptos[id];
    }

    const concepto = await fetch('http://snowtest.andes.gob.ar:8080/browser/MAIN/ODONTO/NEUQUEN/concepts/' + id, {
        headers: { 'Content-Type': 'application/json', 'Accept-Language': 'es' },
    }).then(res => res.json());
    cacheConceptos[id] = concepto;
    return concepto;
}

function getSemanticTagFromFsn(fsn) {
    const startAt = fsn.lastIndexOf('(');
    const endAt = fsn.lastIndexOf(')');
    return fsn.substring(startAt + 1, endAt);
}

async function getByExpression(exp) {
    const conceptos = await fetch('http://snowtest.andes.gob.ar:8080/MAIN/ODONTO/NEUQUEN/concepts?activeFilter=true&limit=1000&ecl=' + exp, {
        headers: { 'Content-Type': 'application/json', 'Accept-Language': 'es' },
    }).then(res => res.json());
    return conceptos;
}

main();