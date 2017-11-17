;/*!node_modules/react-pivot/lib/pivot-table.jsx*/
define('node_modules/react-pivot/lib/pivot-table.jsx', function(require, exports, module) {

  var _ = { range: require('node_modules/lodash/range') }
  var React = require('node_modules/react-pivot/node_modules/react/react')
  var createReactClass = require('node_modules/create-react-class/index')
  var partial = require('node_modules/react-pivot/lib/partial')
  var getValue = require('node_modules/react-pivot/lib/get-value')
  
  module.exports = createReactClass({
  
    getDefaultProps: function () {
      return {
        columns: [],
        rows: [],
        sortBy: null,
        sortDir: 'asc',
        onSort: function () {},
        onSolo: function () {},
        onColumnHide: function () {}
      }
    },
  
    getInitialState: function () {
      return {
        paginatePage: 0
      }
    },
  
    render: function() {
      var results = this.props.rows
  
      var paginatedResults = this.paginate(results)
  
      var tBody = this.renderTableBody(this.props.columns, paginatedResults.rows)
      var tHead = this.renderTableHead(this.props.columns)
  
      return (
        <div className='reactPivot-results'>
          <table className={this.props.tableClassName}>
            {tHead}
            {tBody}
          </table>
  
          {this.renderPagination(paginatedResults)}
        </div>
      )
    },
  
    renderTableHead: function(columns) {
      var self = this
      var sortBy = this.props.sortBy
      var sortDir =  this.props.sortDir
  
      return (
        <thead>
          <tr>
            { columns.map(function(col) {
              var className = col.className
              if (col.title === sortBy) className += ' ' + sortDir
  
              var hide = ''
              if (col.type !== 'dimension') hide = (
                <span className='reactPivot-hideColumn'
                      onClick={partial(self.props.onColumnHide, col.title)}>
                  &times;
                </span>
              )
  
              return (
                <th className={className}
                    onClick={partial(self.props.onSort, col.title)}
                    style={{cursor: 'pointer'}}
                    key={col.title}>
  
                  {hide}
                  {col.title}
                </th>
              )
            })}
          </tr>
        </thead>
      )
    },
  
    renderTableBody: function(columns, rows) {
      var self = this
  
      return (
        <tbody>
          {rows.map(function(row) {
            return (
              <tr key={row._key} className={"reactPivot-level-" + row._level}>
                {columns.map(function(col, i) {
                  if (i < row._level) return <td key={i} className='reactPivot-indent' />
  
                  return self.renderCell(col, row)
                })}
              </tr>
            )
  
          })}
        </tbody>
      )
    },
  
    renderCell: function(col, row) {
      if (col.type === 'dimension') {
        var val = row[col.title]
        var text = val
        var dimensionExists = (typeof val) !== 'undefined'
        if (col.template && dimensionExists) text = col.template(val, row)
      } else {
        var val = getValue(col, row)
        var text = val
        if (col.template) text = col.template(val, row)
      }
  
      if (dimensionExists) {
        var solo = (
          <span className='reactPivot-solo'>
            <a style={{cursor: 'pointer'}}
               onClick={partial(this.props.onSolo, {
                  title: col.title,
                  value: val
                })}>solo</a>
          </span>
        )
      }
  
      return(
        <td className={col.className}
            key={[col.title, row.key].join('\xff')}
            title={col.title}>
          <span dangerouslySetInnerHTML={{__html: text || ''}}></span> {solo}
        </td>
      )
    },
  
    renderPagination: function(pagination) {
      var self = this
      var nPaginatePages = pagination.nPages
      var paginatePage = pagination.curPage
  
      if (nPaginatePages === 1) return ''
  
      return (
        <div className='reactPivot-paginate'>
          {_.range(0, nPaginatePages).map(function(n) {
            var c = 'reactPivot-pageNumber'
            if (n === paginatePage) c += ' is-selected'
            return (
              <span className={c} key={n}>
                <a onClick={partial(self.setPaginatePage, n)}>{n+1}</a>
              </span>
            )
          })}
        </div>
      )
    },
  
    paginate: function(results) {
      if (results.length <= 0) return {rows: results, nPages: 1, curPage: 0}
  
      var paginatePage = this.state.paginatePage
      var nPaginateRows = this.props.nPaginateRows
      if (!nPaginateRows || !isFinite(nPaginateRows)) nPaginateRows = results.length
  
      var nPaginatePages = Math.ceil(results.length / nPaginateRows)
      if (paginatePage >= nPaginatePages) paginatePage = nPaginatePages - 1
  
      var iBoundaryRow = paginatePage * nPaginateRows
  
      var boundaryLevel = results[iBoundaryRow]._level
      var parentRows = []
      if (boundaryLevel > 0) {
        for (var i = iBoundaryRow-1; i >= 0; i--) {
          if (results[i]._level < boundaryLevel) {
            parentRows.unshift(results[i])
            boundaryLevel = results[i]._level
          }
          if (results[i._level === 9]) break
        }
      }
  
      var iEnd = iBoundaryRow + nPaginateRows
      var rows = parentRows.concat(results.slice(iBoundaryRow, iEnd))
  
      return {rows: rows, nPages: nPaginatePages, curPage: paginatePage}
    },
  
    setPaginatePage: function(nPage) {
      this.setState({paginatePage: nPage})
    }
  })
  
  

});

;/*!node_modules/react-pivot/lib/dimensions.jsx*/
define('node_modules/react-pivot/lib/dimensions.jsx', function(require, exports, module) {

  var _ = { compact: require('node_modules/lodash/compact') }
  var React = require('node_modules/react-pivot/node_modules/react/react')
  var createReactClass = require('node_modules/create-react-class/index')
  var partial = require('node_modules/react-pivot/lib/partial')
  
  module.exports = createReactClass({
    getDefaultProps: function () {
      return {
        dimensions: [],
        selectedDimensions: [],
        onChange: function () {}
      }
    },
  
    render: function () {
      var self = this
      var selectedDimensions = this.props.selectedDimensions
      var nSelected = selectedDimensions.length
  
      return (
        <div className="reactPivot-dimensions">
          {selectedDimensions.map(this.renderDimension)}
  
          <select value={''} onChange={partial(self.toggleDimension, nSelected)}>
            <option value={''}>Sub Dimension...</option>
            {self.props.dimensions.map(function(dimension) {
              return <option key={dimension.title}>{dimension.title}</option>
            })}
          </select>
        </div>
      )
    },
  
    renderDimension: function(selectedDimension, i) {
      return (
        <select
          value={selectedDimension}
          onChange={partial(this.toggleDimension, i)}
          key={selectedDimension} >
          <option></option>
          {this.props.dimensions.map(function(dimension) {
            return (
              <option
                value={dimension.title}
                key={dimension.title} >
                {dimension.title}
              </option>
            )
          })}
        </select>
      )
    },
  
    toggleDimension: function (iDimension, evt) {
      var dimension = evt.target.value
      var dimensions = this.props.selectedDimensions
  
      var curIdx = dimensions.indexOf(dimension)
      if (curIdx >= 0) dimensions[curIdx] = null
      dimensions[iDimension] = dimension
  
      var updatedDimensions = _.compact(dimensions)
  
      this.props.onChange(updatedDimensions)
    },
  })
  

});

;/*!node_modules/react-pivot/lib/column-control.jsx*/
define('node_modules/react-pivot/lib/column-control.jsx', function(require, exports, module) {

  var _ = { without: require('node_modules/lodash/without') }
  var React = require('node_modules/react-pivot/node_modules/react/react')
  var createReactClass = require('node_modules/create-react-class/index')
  
  module.exports = createReactClass({
    getDefaultProps: function () {
      return {
        hiddenColumns: [],
        onChange: function () {}
      }
    },
  
    render: function () {
      return (
        <div className='reactPivot-columnControl'>
          { !this.props.hiddenColumns.length ? '' :
            <select value={''} onChange={this.showColumn}>
              <option value={''}>Hidden Columns</option>
              { this.props.hiddenColumns.map(function(column) {
                return <option key={column}>{column}</option>
              })}
            </select>
          }
        </div>
      )
    },
  
    showColumn: function (evt) {
      var col = evt.target.value
      var hidden = _.without(this.props.hiddenColumns, col)
      this.props.onChange(hidden)
    },
  })
  

});

;/*!node_modules/react-pivot/index.jsx*/
define('node_modules/react-pivot/index.jsx', function(require, exports, module) {

  var _ = {
    filter: require('node_modules/lodash/filter'),
    map: require('node_modules/lodash/map'),
    find: require('node_modules/lodash/find')
  }
  var React = require('node_modules/react-pivot/node_modules/react/react')
  var createReactClass = require('node_modules/create-react-class/index')
  var DataFrame = require('node_modules/dataframe/index')
  var Emitter = require('node_modules/wildemitter/wildemitter')
  
  var partial = require('node_modules/react-pivot/lib/partial')
  var download = require('node_modules/react-pivot/lib/download')
  var getValue = require('node_modules/react-pivot/lib/get-value')
  var PivotTable = require('node_modules/react-pivot/lib/pivot-table.jsx')
  var Dimensions = require('node_modules/react-pivot/lib/dimensions.jsx')
  var ColumnControl = require('node_modules/react-pivot/lib/column-control.jsx')
  
  module.exports = createReactClass({
    displayName: 'ReactPivot',
    getDefaultProps: function() {
      return {
        rows: [],
        dimensions: [],
        activeDimensions: [],
        reduce: function() {},
        tableClassName: '',
        csvDownloadFileName: 'table.csv',
        csvTemplateFormat: false,
        defaultStyles: true,
        nPaginateRows: 25,
        solo: {},
        hiddenColumns: [],
        sortBy: null,
        sortDir: 'asc',
        eventBus: new Emitter,
        compact: false,
        excludeSummaryFromExport: false,
        onData: function () {}
      }
    },
  
    getInitialState: function() {
      var allDimensions = this.props.dimensions
      var activeDimensions =  _.filter(this.props.activeDimensions, function (title) {
        return _.find(allDimensions, function(col) {
          return col.title === title
        })
      })
  
      return {
        dimensions: activeDimensions,
        calculations: {},
        sortBy: this.props.sortBy,
        sortDir: this.props.sortDir,
        hiddenColumns: this.props.hiddenColumns,
        solo: this.props.solo,
        rows: []
      }
    },
  
    componentWillMount: function() {
      if (this.props.defaultStyles) loadStyles()
  
      this.dataFrame = DataFrame({
        rows: this.props.rows,
        dimensions: this.props.dimensions,
        reduce: this.props.reduce
      })
  
      this.updateRows()
    },
  
    componentWillReceiveProps: function(newProps) {
       if(newProps.hiddenColumns !== this.props.hiddenColumns) {
           this.setHiddenColumns(newProps.hiddenColumns);
       }
  
      if(newProps.rows !== this.props.rows) {
        this.dataFrame = DataFrame({
          rows: newProps.rows,
          dimensions: this.props.dimensions,
          reduce: this.props.reduce
        })
  
        this.updateRows()
      }
    },
  
    getColumns: function() {
      var self = this
      var columns = []
  
      this.state.dimensions.forEach(function(title) {
        var d =  _.find(self.props.dimensions, function(col) {
          return col.title === title
        })
  
        columns.push({
          type: 'dimension', title: d.title, value: d.value,
          className: d.className, template: d.template
        })
      })
  
      this.props.calculations.forEach(function(c) {
        if (self.state.hiddenColumns.indexOf(c.title) >= 0) return
  
        columns.push({
          type:'calculation', title: c.title, template: c.template,
          value: c.value, className: c.className
        })
      })
  
      return columns
    },
  
    render: function() {
      var self = this
  
      var html = (
        <div className='reactPivot'>
  
        { this.props.hideDimensionFilter ? '' :
          <Dimensions
            dimensions={this.props.dimensions}
            selectedDimensions={this.state.dimensions}
            onChange={this.setDimensions} />
        }
  
          <ColumnControl
            hiddenColumns={this.state.hiddenColumns}
            onChange={this.setHiddenColumns} />
  
          <div className="reactPivot-csvExport">
            <button onClick={partial(this.downloadCSV, this.state.rows)}>
              Export CSV
            </button>
          </div>
  
          { Object.keys(this.state.solo).map(function (title) {
            var value = self.state.solo[title]
  
            return (
              <div
                style={{clear: 'both'}}
                className='reactPivot-soloDisplay'
                key={'solo-' + title} >
                <span
                  className='reactPivot-clearSolo'
                  onClick={partial(self.clearSolo, title)} >
                  &times;
                </span>
                {title}: {value}
              </div>
            )
          }) }
  
          <PivotTable
            columns={this.getColumns()}
            rows={this.state.rows}
            sortBy={this.state.sortBy}
            sortDir={this.state.sortDir}
            onSort={this.setSort}
            onColumnHide={this.hideColumn}
            nPaginateRows={this.props.nPaginateRows}
            onSolo={this.setSolo} />
  
        </div>
      )
  
      return html
    },
  
    updateRows: function () {
      var columns = this.getColumns()
  
      var sortByTitle = this.state.sortBy
      var sortCol = _.find(columns, function(col) {
        return col.title === sortByTitle
      }) || {}
      var sortBy = sortCol.type === 'dimension' ? sortCol.title : sortCol.value
      var sortDir = this.state.sortDir
  
      var calcOpts = {
        dimensions: this.state.dimensions,
        sortBy: sortBy,
        sortDir: sortDir,
        compact: this.props.compact
      }
  
      var filter = this.state.solo
      if (filter) {
        calcOpts.filter = function(dVals) {
          var pass = true
          Object.keys(filter).forEach(function (title) {
            if (dVals[title] !== filter[title]) pass = false
          })
          return pass
        }
      }
  
      var rows = this.dataFrame.calculate(calcOpts)
      this.setState({rows: rows})
      this.props.onData(rows)
    },
  
    setDimensions: function (updatedDimensions) {
      this.props.eventBus.emit('activeDimensions', updatedDimensions)
      this.setState({dimensions: updatedDimensions})
      setTimeout(this.updateRows, 0)
    },
  
    setHiddenColumns: function (hidden) {
      this.props.eventBus.emit('hiddenColumns', hidden)
      this.setState({hiddenColumns: hidden})
      setTimeout(this.updateRows, 0)
    },
  
    setSort: function(cTitle) {
      var sortBy = this.state.sortBy
      var sortDir = this.state.sortDir
      if (sortBy === cTitle) {
        sortDir = (sortDir === 'asc') ? 'desc' : 'asc'
      } else {
        sortBy = cTitle
        sortDir = 'asc'
      }
  
      this.props.eventBus.emit('sortBy', sortBy)
      this.props.eventBus.emit('sortDir', sortDir)
      this.setState({sortBy: sortBy, sortDir: sortDir})
      setTimeout(this.updateRows, 0)
    },
  
    setSolo: function(solo) {
      var newSolo = this.state.solo
      newSolo[solo.title] = solo.value
      this.props.eventBus.emit('solo', newSolo)
      this.setState({solo: newSolo })
      setTimeout(this.updateRows, 0)
    },
  
    clearSolo: function(title) {
      var oldSolo = this.state.solo
      var newSolo = {}
      Object.keys(oldSolo).forEach(function (k) {
        if (k !== title) newSolo[k] = oldSolo[k]
      })
      this.props.eventBus.emit('solo', newSolo)
      this.setState({solo: newSolo})
      setTimeout(this.updateRows, 0)
    },
  
    hideColumn: function(cTitle) {
      var hidden = this.state.hiddenColumns.concat([cTitle])
      this.setHiddenColumns(hidden)
      setTimeout(this.updateRows, 0)
    },
  
    downloadCSV: function(rows) {
      var self = this
  
      var columns = this.getColumns()
  
      var csv = _.map(columns, 'title')
        .map(JSON.stringify.bind(JSON))
        .join(',') + '\n'
  
      var maxLevel = this.state.dimensions.length - 1
      var excludeSummary = this.props.excludeSummaryFromExport
  
      rows.forEach(function(row) {
        if (excludeSummary && (row._level < maxLevel)) return
  
        var vals = columns.map(function(col) {
  
          if (col.type === 'dimension') {
            var val = row[col.title]
          } else {
            var val = getValue(col, row)
          }
  
          if (col.template && self.props.csvTemplateFormat) {
            val = col.template(val)
          }
  
          return JSON.stringify(val)
        })
        csv += vals.join(',') + '\n'
      })
  
      download(csv, this.props.csvDownloadFileName, 'text/csv')
    }
  })
  
  function loadStyles () { ''/*@require ../node_modules/react-pivot/style.css*/ }
  

});
