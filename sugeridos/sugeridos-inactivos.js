/** 

db.getCollection('elementosRUP') .aggregate([ 
    { $unwind: '$frecuentes' },
    { $group: { _id: '$frecuentes.conceptId', concepto: {'$first': '$frecuentes'  } } },
    { $replaceRoot : { newRoot: '$concepto' }  },
    { $project: {_id: 0, refsetIds: 0} }
]).toArray()

 */

const jsonfile = require('jsonfile')
const fetch = require('node-fetch');
const conceptos = require('./sugeridos.json');

async function main() {
    console.log('Total chunks:', conceptos.length);
    const inactive = [];
    const concepts = await getConcept(conceptos);
    concepts.filter(c => !c.active).forEach(c => {
        const conceptFind = conceptos.find(cc => cc.conceptId === c.conceptId);
        inactive.push({
            ...conceptFind
        })
    });

    console.log(JSON.stringify(inactive));
    // jsonfile.writeFileSync('conceptos-inactivos.json', inactive, { spaces: 4 })
}

main();

async function getConcept(conceptos) {
    const ids = conceptos.map(c => c.conceptId);
    return await fetch('http://snowtest.andes.gob.ar:8080/browser/MAIN/ODONTO/NEUQUEN/concepts/bulk-load', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conceptIds: ids })
    }).then(res => res.json());

}
