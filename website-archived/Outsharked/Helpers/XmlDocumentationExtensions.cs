// Reading XML Documentation at Run-Time
// Bradley Smith - 2010/11/25

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Xml.Linq;
using System.Xml.XPath;

using IQObjectMapper;

namespace Outsharked.Helpers
{

    /// <summary>
    /// Provides extension methods for reading XML comments from reflected members.
    /// </summary>
    public static class XmlDocumentationExtensions
    {

        private static Dictionary<string, XDocument> cachedXml;

        /// <summary>
        /// Static constructor.
        /// </summary>
        static XmlDocumentationExtensions()
        {
            cachedXml = new Dictionary<string, XDocument>(StringComparer.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Returns the expected name for a member element in the XML documentation file.
        /// </summary>
        /// <param name="member">The reflected member.</param>
        /// <returns>The name of the member element.</returns>
        private static string GetMemberElementName(MemberInfo member)
        {
            char prefixCode;
            string memberName = (member is Type)
                ? ((Type)member).FullName                               // member is a Type
                : (member.DeclaringType.FullName + "." + member.Name);  // member belongs to a Type

            switch (member.MemberType)
            {
                case MemberTypes.Constructor:
                    // XML documentation uses slightly different constructor names
                    memberName = memberName.Replace(".ctor", "#ctor");
                    goto case MemberTypes.Method;
                case MemberTypes.Method:
                    prefixCode = 'M';

                    // parameters are listed according to their type, not their name
                    string paramTypesList = String.Join(
                        ",",
                        ((MethodBase)member).GetParameters()
                            .Cast<ParameterInfo>()
                            .Select(x => x.ParameterType.FullName
                        ).ToArray()
                    );
                    if (!String.IsNullOrEmpty(paramTypesList)) memberName += "(" + paramTypesList + ")";
                    break;

                case MemberTypes.Event:
                    prefixCode = 'E';
                    break;

                case MemberTypes.Field:
                    prefixCode = 'F';
                    break;

                case MemberTypes.NestedType:
                    // XML documentation uses slightly different nested type names
                    memberName = memberName.Replace('+', '.');
                    goto case MemberTypes.TypeInfo;
                case MemberTypes.TypeInfo:
                    prefixCode = 'T';
                    break;

                case MemberTypes.Property:
                    prefixCode = 'P';
                    break;

                default:
                    throw new ArgumentException("Unknown member type", "member");
            }

            // elements are of the form "M:Namespace.Class.Method"
            return String.Format("{0}:{1}", prefixCode, memberName);
        }

        /// <summary>
        /// Returns the XML documentation (summary tag) for the specified member.
        /// </summary>
        /// <param name="member">The reflected member.</param>
        /// <returns>The contents of the summary tag for the member.</returns>
        public static string GetXmlDocumentation(this MemberInfo member)
        {
            AssemblyName assemblyName = member.Module.Assembly.GetName();
            return GetXmlDocumentation(member, assemblyName.Name + ".xml");
        }

        /// <summary>
        /// Returns the XML documentation (summary tag) for the specified member.
        /// </summary>
        /// <param name="member">The reflected member.</param>
        /// <param name="pathToXmlFile">Path to the XML documentation file.</param>
        /// <returns>The contents of the summary tag for the member.</returns>
        public static string GetXmlDocumentation(this MemberInfo member, string pathToXmlFile)
        {
            AssemblyName assemblyName = member.Module.Assembly.GetName();
            XDocument xml = null;

            if (cachedXml.ContainsKey(assemblyName.FullName))
                xml = cachedXml[assemblyName.FullName];
            else
                cachedXml[assemblyName.FullName] = (xml = XDocument.Load(pathToXmlFile));

            return GetXmlDocumentation(member, xml);
        }

        /// <summary>
        /// Returns the XML documentation (summary tag) for the specified member.
        /// </summary>
        /// <param name="member">The reflected member.</param>
        /// <param name="xml">XML documentation.</param>
        /// <returns>The contents of the summary tag for the member.</returns>
        public static string GetXmlDocumentation(this MemberInfo member, XDocument xml)
        {
            return xml.XPathEvaluate(
                String.Format(
                    "string(/doc/members/member[@name='{0}']/summary)",
                    GetMemberElementName(member)
                )
            ).ToString().Trim();
        }

        /// <summary>
        /// Returns the XML documentation (returns/param tag) for the specified parameter.
        /// </summary>
        /// <param name="parameter">The reflected parameter (or return value).</param>
        /// <returns>The contents of the returns/param tag for the parameter.</returns>
        public static string GetXmlDocumentation(this ParameterInfo parameter)
        {
            AssemblyName assemblyName = parameter.Member.Module.Assembly.GetName();
            return GetXmlDocumentation(parameter, assemblyName.Name + ".xml");
        }

        /// <summary>
        /// Returns the XML documentation (returns/param tag) for the specified parameter.
        /// </summary>
        /// <param name="parameter">The reflected parameter (or return value).</param>
        /// <param name="pathToXmlFile">Path to the XML documentation file.</param>
        /// <returns>The contents of the returns/param tag for the parameter.</returns>
        public static string GetXmlDocumentation(this ParameterInfo parameter, string pathToXmlFile)
        {
            AssemblyName assemblyName = parameter.Member.Module.Assembly.GetName();
            XDocument xml = null;

            if (cachedXml.ContainsKey(assemblyName.FullName))
                xml = cachedXml[assemblyName.FullName];
            else
                cachedXml[assemblyName.FullName] = (xml = XDocument.Load(pathToXmlFile));

            return GetXmlDocumentation(parameter, xml);
        }

        /// <summary>
        /// Returns the XML documentation (returns/param tag) for the specified parameter.
        /// </summary>
        /// <param name="parameter">The reflected parameter (or return value).</param>
        /// <param name="xml">XML documentation.</param>
        /// <returns>The contents of the returns/param tag for the parameter.</returns>
        public static string GetXmlDocumentation(this ParameterInfo parameter, XDocument xml)
        {
            if (parameter.IsRetval || String.IsNullOrEmpty(parameter.Name))
                return xml.XPathEvaluate(
                    String.Format(
                        "string(/doc/members/member[@name='{0}']/returns)",
                        GetMemberElementName(parameter.Member)
                    )
                ).ToString().Trim();
            else
                return xml.XPathEvaluate(
                    String.Format(
                        "string(/doc/members/member[@name='{0}']/param[@name='{1}'])",
                        GetMemberElementName(parameter.Member),
                        parameter.Name
                    )
                ).ToString().Trim();
        }

        public static IList<string> MatchingMethods(Type type, string text)
        {
            var cinfo = ObjectMapper.GetClassInfo(type, new IQObjectMapper.Impl.ReflectionOptions() { IncludeMethods = true });
            if (String.IsNullOrEmpty(text))
            {
                return new List<string>();
            }
            return cinfo.FieldNames.Where(item => item.Contains(text)).ToList();

        }
    }
}