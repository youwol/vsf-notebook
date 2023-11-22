from youwol.app.environment import YouwolEnvironment
from youwol.app.routers.projects.models_project import BrowserApp, Execution, Link, BrowserAppGraphics, \
    IPipelineFactory, \
    OpenWith
from youwol.pipelines.pipeline_typescript_weback_npm import pipeline, PipelineConfig, PublishConfig
from youwol.utils.context import Context


class PipelineFactory(IPipelineFactory):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    async def get(self, _env: YouwolEnvironment, context: Context):
        config = PipelineConfig(target=BrowserApp(
            displayName="vs-flow-notebook",
            graphics=BrowserAppGraphics(
                appIcon=icon(size_px='100%', border_radius='15%', icon_path=app_icon),
                fileIcon=icon(size_px='100%', border_radius='15%', icon_path=file_icon, bg_size='contain'),
                background={
                    "class": "h-100 w-100",
                    "style": {
                        "opacity": 0.3,
                        "background-image": app_icon,
                        "background-size": "cover",
                        "background-repeat": "no-repeat",
                        "background-position": "center center",
                        "filter": "drop-shadow(rgb(0, 0, 0) 1px 3px 5px)",
                    },
                },
            ),
            execution=Execution(
                standalone=True,
                parametrized=[
                    OpenWith(
                        match={"kind": "vsf-notebook"},
                        parameters={"id": 'assetId'}
                    )
                ]
            ),
            links=[
                Link(name="doc", url="dist/docs/index.html"),
                Link(name="coverage", url="coverage/lcov-report/index.html"),
                Link(name="bundle-analysis", url="dist/bundle-analysis.html")
            ]
        ),
            publishConfig=PublishConfig(
                packagedFolders=["assets"],
            )
        )
        return await pipeline(config, context)


assets_dir = '/api/assets-gateway/raw/package/QHlvdXdvbC92c2Ytbm90ZWJvb2s=/0.1.2/assets'
app_icon = f"url('{assets_dir}/vsf_flow_app.svg')"
file_icon = f"url('{assets_dir}/vsf_flow_file.svg')"


def icon(size_px: str, border_radius: str, icon_path: str, bg_size: str = "cover"):
    return {
        "style": {
            "width": f"{size_px}",
            "height": f"{size_px}",
            "background-image": icon_path,
            "background-size": bg_size,
            "background-repeat": "no-repeat",
            "background-position": "center center",
            "filter": "drop-shadow(rgb(0, 0, 0) 1px 3px 5px)",
            "border-radius": f"{border_radius}",
        }
    }
