from tethys_sdk.base import TethysAppBase, url_map_maker


class GapFillerTool(TethysAppBase):
    """
    Tethys app class for Gap Filler Tool.
    """

    name = 'Gap Filler Tool'
    index = 'gap_filler_tool:home'
    icon = 'gap_filler_tool/images/icon.gif'
    package = 'gap_filler_tool'
    root_url = 'gap-filler-tool'
    color = '#1abc9c'
    wps_url = 'http://appsdev.hydroshare.org:8282/wps/'
        
    def url_maps(self):
        """
        Add controllers
        """
        UrlMap = url_map_maker(self.root_url)

        url_maps = (UrlMap(name='home',
                           url='gap-filler-tool',
                           controller='gap_filler_tool.controllers.home'),

                    UrlMap(name='temp_waterml',
                           url='temp_waterml/{id}',
                           controller='gap_filler_tool.controllers.temp_waterml'),

                    UrlMap(name='chart_data',
                           url='chart_data/{res_id}',
                           controller='gap_filler_tool.controllers.chart_data'),

                    UrlMap(name='wps',
                           url='wps/{res_ids}',
                           controller='gap_filler_tool.controllers.wps'),

                    UrlMap(name='r-script',
                           url='r-script/{res_ids}/gap-filler-tool.R',
                           controller='gap_filler_tool.controllers.r_script'),

        )

        return url_maps