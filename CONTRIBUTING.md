# Contributing to ImageMapster

:+1::tada: First off, thanks for taking the time to contribute! :tada::+1:

The following is a set of guidelines for contributing to ImageMapster.

Please take a moment to review this document in order to make the contribution process easy and effective for everyone involved. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Using the issue tracker

The [issue tracker](https://github.com/jamietre/ImageMapster/issues) is the preferred channel for [bug reports](#bug-reports), [features requests](#feature-requests) and [submitting pull requests](#pull-requests).

**Please do not use the issue tracker for personal support requests.** For questions, how to's, etc. please see the [Support Page](SUPPORT.md) for options.

## Bug reports

A bug is a _demonstrable problem_ that is caused by the code in the repository. Good bug reports are extremely helpful, so thank you!

Guidelines for bug reports:

1. **Lint your code** &mdash; Use [eslint](http://eslint.org/) to ensure your problem isn't caused by a simple error in your own code.
1. **Use the GitHub issue search** &mdash; check if the issue has already been reported.
1. **Check if the issue has been fixed** &mdash; try to reproduce it using the latest `master` or development branch in the repository.
1. **Isolate the problem** &mdash; ideally create a [reduced test case](https://css-tricks.com/reduced-test-cases/) and a [live example](https://jsfiddle.net).

A good bug report shouldn't leave others needing to chase you up for more information. Please try to be as detailed as possible in your report. What is your environment? What steps will reproduce the issue? What browser(s) and OS experience the problem? Do other browsers show the bug differently? What would you expect to be the outcome? All these details will help people to fix any potential bugs.

Once you have established that there is a potential issue, please use the [bug report](https://github.com/jamietre/ImageMapster/issues/new?template=bug_report.md) issue template and supply all requested information. If the required information is not provided, your issue will be marked with the 'needs author feedback' label and closed until there is enough information for the team to evaluate/reproduce.

## Feature requests

Feature requests are welcome. But take a moment to find out whether your idea fits with the scope and aims of the project.

Please use the [feature request](https://github.com/jamietre/ImageMapster/issues/new?template=feature_request.md) issue template and supply all requested information. If the required information is not provided, your issue will be marked with the 'needs author feedback' label and closed until there is enough information to evaluate your proposal.

## Pull requests

Good pull requests—patches, improvements, new features, etc. are a fantastic help. They should remain focused in scope and avoid containing unrelated commits.

Please use the [pull request](https://github.com/jamietre/ImageMapster/pulls/new?template=PULL_REQUEST_TEMPLATE.md) template and supply all requested information. If the required information is not provided, your issue will be marked with the 'needs author feedback' label and closed until there is enough information to evaluate your proposal.

**Please ask first** before embarking on any significant pull request (e.g. implementing features or refactoring code), otherwise you risk spending a lot of time working on something that the project's maintainers might not want to merge into the project.

In lieu of a formal style-guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. If the type of unit test required to support your pull request is not supported by the current test framework (iqTest), please add an example covering the functionality. Please make sure your changes build by running `grunt build` as described in the [development section](README.md#development) of the [Readme](README.md).

## License

By contributing your code, you agree to license your contribution under the [MIT License](LICENSE).
