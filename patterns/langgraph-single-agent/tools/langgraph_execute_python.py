"""LangGraph-specific wrapper for Code Interpreter."""

from langchain_core.tools import tool
from tools.code_interpreter.code_interpreter_tools import CodeInterpreterTools


class LangGraphCodeInterpreterTools:
    """LangGraph wrapper for Code Interpreter tools."""

    def __init__(self, region: str):
        """
        Initialize LangGraph Code Interpreter tools.

        Args:
            region: AWS region for code interpreter
        """
        self.core_tools = CodeInterpreterTools(region)

    def cleanup(self):
        """Clean up code interpreter session."""
        self.core_tools.cleanup()

    @tool
    def execute_python(self, code: str, description: str = "") -> str:
        """
        Execute Python code in secure sandbox.

        Args:
            code: Python code to execute
            description: Optional description of what the code does

        Returns:
            JSON string with execution result
        """
        return self.core_tools.execute_python(code, description)
