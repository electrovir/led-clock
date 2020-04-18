import {insulate, readInsulationConfigFile} from 'insulation';

async function main() {
    const {invalidDeps, modules} = await insulate(readInsulationConfigFile('./.insulation.json'), './projects', true);
    console.log(JSON.stringify(modules, null, 4));
}

main().catch(error => console.log(error));
