using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.SqlServerCe;
using System.Data;
using IQMap.Impl;

namespace Outsharked.Framework
{
    public class CEController: MSSQLDataStorageController
    {
        public override System.Data.IDbConnection GetConnection(string connectionString)
        {
            return new SqlCeConnection(connectionString);
        }
        protected override int InsertAndReturnNewID(System.Data.IDbConnection conn, IQMap.ISqlQuery query, System.Data.IDbTransaction transaction = null, System.Data.CommandBehavior commandBehavior = System.Data.CommandBehavior.Default)
        {

            //var newQuery= new SqlQueryDef(, query.Parameters);

            var newQ= new IQMap.SqlQueryBuilder.Impl.SqlQueryDef( query.GetQuery() + "", query.Parameters);
            int result = 0;

            using (var cmd = GetCommand(conn, newQ, transaction))
            {
                
                ExecuteSqlFinal(new Action(() =>
                {
                    cmd.ExecuteNonQuery();
                }));

                cmd.Parameters.Clear();
                cmd.CommandText = "SELECT @@IDENTITY;";
                result = Convert.ToInt32(cmd.ExecuteScalar());
                cmd.Dispose();
            }
            if (commandBehavior == CommandBehavior.CloseConnection)
            {
                conn.Close();
            }
            OnQueryComplete();
            return result;
        }
    }
}