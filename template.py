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
    "@youwol/vsf-core": "^0.2.3",
    "@youwol/vsf-canvas": "^0.2.2",
    "rxjs": "^6.5.5",
    "@youwol/logging": "^0.1.1",
    "@youwol/http-clients": "^2.0.5",
    "@youwol/http-primitives": "^0.1.2",
    "@youwol/flux-view": "^1.1.0",
    "@youwol/cdn-client": "^2.0.6",
    "@youwol/fv-tabs": "^0.2.1",
    "@youwol/os-top-banner": "^0.1.1",
    "@youwol/fv-code-mirror-editors": "^0.2.2",
    "@youwol/fv-tree": "^0.2.3",
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
            # `@types/lz-string` required for documentation step
            # "@types/lz-string": "^1.5.0"
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
    "tsconfig.json",
    "webpack.config.ts",
]:
    shutil.copyfile(src=folder_path / ".template" / file, dst=folder_path / file)
