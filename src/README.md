# DP³

CESNET DP³ plugin for Grafana.

Provides simple and universal platform to access and visualize data from any DP³ instance.

Includes DP³ **data source** support, **panel** for displaying history of multi value attributes,
as well as a **dashboard generator**.

## Getting started

### Installation

This plugin can be installed from Grafana plugin catalog.

To do so, navigate to `Menu > Administration > Plugins`, search for `DP³` and press `Install` button.

### Adding data source

After installation, add a new DP³ data source in `Data sources` page in your Grafana web interface.
You will need a DP³ API URL thats accessible from user's browser.

### Dashboard generation

The plugin provides an overview page for all configured DP³ data sources and dashboard generation.
It's located in `Menu > Apps > DP³`.

You can generate two types of dashboards for every entity type:
- full overview: contains just one table with all current values of all attributes
- EID: contains one or more panels for each attribute and
  displays both current value and history of EID entered in the dashboard itself

#### Modifying and extending generated dashboards

These generated dashboards are meant primarily for reference and getting started,
so when you get to know Grafana better, it's highly recommended to modify them or even better,
to create a completely custom dashboard for your use-case.
This way, you can even combine data from multiple data sources (including non-DP³) together.

## Documentation

Documentation for whole DP³ project is available here: https://cesnet.github.io/dp3/
