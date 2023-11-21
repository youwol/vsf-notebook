import shutil
from pathlib import Path

from youwol.pipelines.pipeline_typescript_weback_npm import (
    Template,
    PackageType,
    Dependencies,
    RunTimeDeps,
    generate_template,
    DevServer,
    Bundles,
    MainModule,
)
from youwol.utils import parse_json

folder_path = Path(__file__).parent

pkg_json = parse_json(folder_path / "package.json")

load_dependencies = {
    "@youwol/vsf-core": "^0.3.0",
    "@youwol/vsf-canvas": "^0.3.0",
    "rxjs": "^7.5.6",
    "@youwol/logging": "^0.2.0",
    "@youwol/http-clients": "^3.0.0",
    "@youwol/http-primitives": "^0.2.0",
    "@youwol/rx-vdom": "^1.0.1",
    "@youwol/webpm-client": "^3.0.0",
    "@youwol/rx-tab-views": "^0.3.0",
    "@youwol/os-top-banner": "^0.2.0",
    "@youwol/rx-code-mirror-editors": "^0.4.1",
    "@youwol/rx-tree-views": "^0.3.0",
    "three": "^0.152.0",
    "marked": "^4.2.3",
}

template = Template(
    path=folder_path,
    type=PackageType.Application,
    name=pkg_json["name"],
    version=pkg_json["version"],
    shortDescription=pkg_json["description"],
    author=pkg_json["author"],
    dependencies=Dependencies(
        runTime=RunTimeDeps(
            externals=load_dependencies,
            includedInBundle={"d3-dag": "0.8.2", "client-zip": "2.3.0"},
        ),
        devTime={
            "lz-string": "^1.4.4",  # Required to generate doc
        },
    ),
    userGuide=True,
    devServer=DevServer(port=3014),
    bundles=Bundles(
        mainModule=MainModule(
            entryFile="./index.ts", loadDependencies=list(load_dependencies.keys())
        )
    ),
)

generate_template(template)
shutil.copyfile(
    src=folder_path / ".template" / "src" / "auto-generated.ts",
    dst=folder_path / "src" / "auto-generated.ts",
)
for file in [
    "README.md",
    "package.json",
    "jest.config.ts",
    # "tsconfig.json", need to reference rx-vdom-config.ts
    "webpack.config.ts",
]:
    shutil.copyfile(src=folder_path / ".template" / file, dst=folder_path / file)
