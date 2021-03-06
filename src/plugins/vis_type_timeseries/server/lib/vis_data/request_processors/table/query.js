/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { getTimerange } from '../../helpers/get_timerange';
import { getIntervalAndTimefield } from '../../get_interval_and_timefield';
import { esQuery } from '../../../../../../data/server';

export function query(req, panel, esQueryConfig, indexPattern) {
  return (next) => (doc) => {
    const { timeField } = getIntervalAndTimefield(panel, {}, indexPattern);
    const { from, to } = getTimerange(req);

    doc.size = 0;

    const queries = !panel.ignore_global_filter ? req.body.query : [];
    const filters = !panel.ignore_global_filter ? req.body.filters : [];
    doc.query = esQuery.buildEsQuery(indexPattern, queries, filters, esQueryConfig);

    const timerange = {
      range: {
        [timeField]: {
          gte: from.toISOString(),
          lte: to.toISOString(),
          format: 'strict_date_optional_time',
        },
      },
    };
    doc.query.bool.must.push(timerange);
    if (panel.filter) {
      doc.query.bool.must.push(
        esQuery.buildEsQuery(indexPattern, [panel.filter], [], esQueryConfig)
      );
    }

    return next(doc);
  };
}
